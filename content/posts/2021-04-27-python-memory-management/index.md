---
title: 파이썬이 메모리를 관리하는 방법
slug: python-memory-management
author: Seonghyeon Kim
date: 2021-04-27
hero: ./images/title.jpg
excerpt: 운영체제메모리도둑파이썬
---

C, C++ 같은 언어와는 달리 파이썬은 메모리의 할당과 해제가 파이썬 인터프리터에 의해 자동으로 관리됩니다. 이 글에서는 파이썬, 정확히는 가장 많이 사용되는 파이썬 인터프리터인 CPython(이하 "파이썬")이 메모리를 어떻게 관리하는지 그 세부 구현에 대해 소개합니다.

## 파이썬의 메모리 구조

파이썬에서 메모리에 할당되는것은 AST 객체와 일반 데이터 객체, 크게 두가지로 나뉩니다. 그중 AST 객체는 (Python/pyarena.c) 의 PyArena에 저장되고 일반 데이터 객체는 (Python/obmalloc.c) 의 `PyObject_*, PyMem_* API` 를 통해 메모리에 저장됩니다.

본 글에서는 일반 데이터 객체를 중점으로 설명합니다.

파이썬에서는 객체를 `PyObject_New` 매크로 또는 직접 `PyObject_Malloc`, `PyObject_Calloc` 객체 할당자를 사용해 힙에 할당합니다. 이러한 할당자들은 결국 최종적으로 malloc, mmap, VirtualAlloc 등의 범용 메모리 할당자들을 이용하게 되는데 파이썬은 메모리를 효율적으로 관리하기 위해 이러한 범용 할당자와 객체 할당자 사이에 pymalloc 메모리 할당자 계층이 추가되어 있습니다.

일종의 최적화로써 pymalloc은 할당하고자 하는 객체의 크기에 따라 다른 전략을 취합니다. `SMALL_REQUEST_THRESHOLD` 전처리기 상수로 정의되 있는 512바이트보다 작은 객체는 pymalloc 할당자를 사용하지만 512바이트를 초과하는 객체에 대해서는 pymalloc 할당자를 사용하지 않고 malloc등의 범용 메모리 할당자를 사용하는 `PyMem_RawMalloc` 저수준 메모리 할당자를 사용하여 객체를 할당합니다.

```c
void *
PyObject_Malloc(size_t size)
{
    /* see PyMem_RawMalloc() */
    if (size > (size_t)PY_SSIZE_T_MAX)
        return NULL;
    return _PyObject.malloc(_PyObject.ctx, size);  // _PyObject_Malloc
}

// 생략

static void *
_PyObject_Malloc(void *ctx, size_t nbytes)
{
    void* ptr = pymalloc_alloc(ctx, nbytes);
    if (LIKELY(ptr != NULL)) {
        return ptr;
    }

    ptr = PyMem_RawMalloc(nbytes);
    if (ptr != NULL) {
        raw_allocated_blocks++;
    }
    return ptr;
}
```

파이썬은 512바이트 미만 객체에 대해서는 수명이 짧고 작은 객체에 최적화된 pymalloc 할당자를 사용함으로써 적은 비용으로 더 많은 할당을 수행할 수 있습니다. pymalloc 할당자는 이러한 작은 객체들을 "아레나", "풀", "블록" 이라는 구조의 미리 할당해둔 메모리 풀에서 관리합니다.

### 블록

블록은 하나의 객체를 저장할 수 있는 pymalloc의 최소 구조입니다. 한 블럭은 8바이트에서 512바이트까지 8바이트 단위로 할당됩니다. 만약 7바이트 객체면 8블럭, 500바이트 객체면 512바이트 블록에 저장되는 형식입니다.

| Request in bytes | Size of allocated block | Size class idx |
| ---------------- | ----------------------- | -------------- |
| 1-8              | 8                       | 0              |
| 9-16             | 16                      | 1              |
| 17-24            | 24                      | 2              |
| 25-32            | 32                      | 3              |
| ...              | ...                     | ...            |
| 497-504          | 504                     | 62             |
| 505-512          | 512                     | 63             |

### 풀

동일한 단위의 블록의 모음을 풀이라고 합니다. 풀의 크기는 x86 아키텍처의 페이지 크기와 같은 4KB이며 큰 단위의 블록을 가지는 풀일수록 할당 가능한 블록의 갯수가 적습니다. 

pymalloc이 사용하는 모든 풀은 `usedpools` 풀 배열에 의해 관리됩니다. `usedpools` 배열의 각 인덱스는 풀의 이중 연결 리스트에 연결되어 있기 때문에 pymalloc 할당자는 객체를 할당할 때 `usedpools` 배열에서 원하는 단위의 풀 리스트를 찾아 마지막 풀 (마지막 풀이 꽉 차있을 경우엔 새 풀을 할당해서 리스트에 추가합니다.) 의 빈 블럭에 객체를 할당하게 됩니다.

```c
struct pool_header {
    union { block *_padding;
            uint count; } ref;          /* number of allocated blocks    */
    block *freeblock;                   /* pool's free list head         */
    struct pool_header *nextpool;       /* next pool of this size class  */
    struct pool_header *prevpool;       /* previous pool       ""        */
    uint arenaindex;                    /* index into arenas of base adr */
    uint szidx;                         /* block size class index        */
    uint nextoffset;                    /* bytes to virgin block         */
    uint maxnextoffset;                 /* largest valid nextoffset      */
};

typedef struct pool_header *poolp;

static poolp usedpools[64];  // 초기화 생략

/*
 usedpools     
 +-----+
 |  0  | -> [8byte pool] <-> [8byte pool]
 +-----+
 |  1  | -> [16byte pool] <-> [16byte pool] <-> [16byte pool]
 +-----+
 |  2  | -> [24byte pool]
 +-----+
 | ... | -> [nbyte pool] <-> [nbyte pool] <-> [nbyte pool]
 +-----+
 | 63  | -> [512byte pool] <-> [512byte pool]
 +-----+
 */
```

### 아레나

아레나는 페이지 사이즈에 정렬되는 256KB의 메모리 청크로 64개의 풀에 메모리를 제공합니다.(풀은 메모리에 직접 할당되지 않고 미리 할당된 아레나에서 메모리를 제공받습니다.)

pymalloc 할당자가 malloc등의 범용 메모리 할당자로 할당 또는 해제(블록이나 풀은 해제되어도 아레나가 전체 해제되지 않는 이상 운영체제로 반환되지 않습니다.) 할 수 있는 최소 단위로 256KB의 큰 단위이고 페이지 사이즈에 정렬되는 만큼 mmap 또는 VirtualAlloc 등의 페이지 단위로 할당되는 시스템 콜로 할당이 먼저 시도됩니다.

```c
struct arena_object {
    uintptr_t address;
    block* pool_address;
    uint nfreepools;
    uint ntotalpools;
    struct pool_header* freepools;
    struct arena_object* nextarena;
    struct arena_object* prevarena;
};

static struct arena_object* arenas = NULL;
static struct arena_object* unused_arena_objects = NULL;
static struct arena_object* usable_arenas = NULL;
```

아레나 구조체와 연관 배열을 보면 전체 아레나들은 배열, 사용되지 않은 아레나들은 단일 연결 리스트, 사용중인 아레나들은 이중 연결 리스트로 묶여서 관리되어 관리가 편리한 구조로 설계되어 있는 것을 볼 수 있으며 아레나 구조체는 현재 사용 가능한 풀들에 대한 정보와 객체를 할당할 풀의 주소, 비어 있는 풀들에 대한 단일 연결 리스트를 가지고 있습니다

## 파이썬의 메모리 관리기법

파이썬은 프로그래머가 메모리의 할당과 해제를 명시적으로 수행하지 않는 만큼 객체가 더 이상 사용되지 않으면 알아서 해당 객체를 메모리에서 해제해야 합니다.이를 위해 파이썬은 레퍼런스 카운팅과 가비지 컬렉션의 두가지 방법을 모두 사용합니다. (사실 레퍼런스 카운팅도 가비지 컬렉션의 일종이지만 편의상 추적 방식의 가비지 컬렉션만을 가비지 컬렉션이라고 부르겠습니다.)

### 레퍼런스 카운팅

레퍼런스 카운팅은 객체 내부에 객체가 참조되는 횟수를 기록하고 객체가 더이상 참조되지 않아 참조 횟수가 0이되면 객체를 파괴하는 간단한 메커니즘입니다. 

`a = 1` 이라는 단순한 파이썬 코드에서도 레퍼런스 카운팅에 의한 메모리의 관리가 이루어집니다. a 라는 이름에 1의 참조가 걸리고 a 라는 이름이 스코프를 벗어나는 등의 이유로 파괴될 때 1에 대한 참조 또한 0으로 떨어지게 됩니다. (실제 파이썬 구현에는 작은 정수는 free list라는 추가 최적화로 인해 레퍼런스 카운트에 상관없이 메모리에서 해제되지 않습니다.)

파이썬 내부에서는 `Py_INCREF` 매크로를 사용하여 참조 횟수를 증가시키고 `Py_DECREF` 매크로를 사용하여 참조 횟수를 감소시킵니다. 만약 참조 횟수가 0이 된다면 `Py_DECREF` 매크로는 `_Py_Dealloc` 함수를 사용하여 메모리에서 객체를 해제합니다. 

사실 파이썬에서 GIL을 제거하기 어려운 이유 중 하나가 바로 레퍼런스 카운팅입니다. GIL로 인해 한번에 한 스레드만 메모리와 프로세서를 차지할 수 있기 때문에 파이썬에서는 제한 없는 동시성 환경에서 레퍼런스 카운팅을 사용할때 발생하는 경쟁 상태, 비싼 비용 지불에 대해 고민하지 않고 레퍼런스 카운팅을 오랫동안 사용해 왔습니다, GIL을 파이썬으로부터 제거하려면 먼저 레퍼런스 카운팅 기반의 메모리 관리를 파이썬에서 제거해야 합니다.

### 가비지 컬렉션

현재 버전의 파이썬에서 사용되는 레퍼런스 카운팅은 단순하고 더 이상 메모리가 사용되지 않으면 바로바로 회수할 수 있다는 큰 장점이 있습니다. 그러나 레퍼런스 카운팅은 한가지 근본적인 약점을 가지고 있는데 바로 순환 참조를 해결할 수 없다는 것입니다.

```python
l = []
l.append(l)

del l
```

`l`에 리스트 객체를 할당한 후 해당 객체에 자기 자신에 대한 참조를 추가한다면 해당 객체는 `l` 이라는 이름이 파괴된 이후에도 자기 자신의 대한 참조로 인해 참조 횟수가 0 이상이 항상 유지되어 메모리에서 해제되지 않게 됩니다. 

사실 순환 참조를 만드는 것은 권장되는 방법이 아니며 회피도 쉽게 가능하지만 인지하지 못하고 순환참조를 만들게 될 경우 장기 실행 프로세스일 경우 레퍼런스 카운팅만을 사용했을 경우에는 순환 참조가 해제되지 않는 메모리를 발생시켜 메모리 부족등의 문제를 겪을 수 있습니다.

그렇기 때문에 파이썬의 개발자들이 순환 참조를 해결하기 위해 도입한 것이 바로 흔히 가비지 컬렉션이라고 지칭하는 순환 가비지 컬렉션입니다. 

다만 파이썬의 가비지 컬렉션은 JVM등에서 사용하는 전통적인 가비지 컬렉션과는 조금 상이합니다. JVM등의 일반적인 가비지 컬렉션은 GC 루트 집합에서부터 연결 가능한 모든 살아있는 객체를 추적하여 연결되지 않은 나머지 객체들을 해제하지만 파이썬의 구조적 문제로 인해 파이썬은 루트 집합을 결정하는 것이 불가능해서 일반적인 가비지 컬렉션과 같은 방법으로 동작하지 않습니다. 

파이썬의 가비지 컬렉션은 살아있다고 판정한 모든 객체를 해제하는 방식이 아니라 확실히 죽은 객체만을 찾아 해제하는 방식을 사용해 비결정적인 루트 집합 사용으로 인해 발생 가능한 살아있는 객체를 해제하는 위험을 무릅쓰지 않으려고 합니다.

또한 파이썬에 가비지 컬렉션이 도입된 이유가 순환 참조 해결인만큼 파이썬의 가비지컬렉션은 순환 참조를 처리하기 위해 특화되어 있습니다. 대표적으로, 파이썬에선 다른 객체에 대한 참조(자기 자신에 대한 참조도 가능)는 컨테이너 타입들만 가질 수 있기 때문에 파이썬 개발자들은 파이썬이 가비지 컬렉션 대상인 컨테이너 객체들의 리스트들을 따로 유지하여 그 리스트에서만 컬렉션이 수행되도록 설계했습니다. (다만 최적화로 인해 비 컨테이터 객체만을 담는 튜플 등은 가비지 컬렉션 대상이 아닌 등 예외가 몇가지 존재합니다.)

그렇기 때문에 일반 객체와 달리 가비지 컬렉션을 지원하는 컨테이너 객체는 객체의 생성도 `PyObject_New가` 아닌 `PyObject_GC_New` 로 수행하는 등 가비지 컬렉션 대상 리스트과 가비지 컬렉션 관련 데이터를 유지하기 위해 일반 객체와는 다르게 관리됩니다.

### 가비지 컬렉션 최적화

가비지 컬렉션 최적화를 위해 파이썬은 다른 많은 가비지 컬렉션 구현처럼 세대별 가비지 컬렉션을 사용합니다. 간단히 말해 각 객체는 0세대로 출발해 각 세대별 GC에서 살아남을때 세대가 증가하여 최대 2세대까지 성장할 수 있습니다. 이 세대별 가비지 컬렉션은 최근에 생성된 객체일수록 일찍 수명을 다하고 오래된 객체일수록 더욱 오래 존재할 것이라는 가설을 기반으로 작동합니다. 따라서 0세대에서 컬렉션이 가장 빈번하게 수행되고 세대가 증가할 수록 컬렉션은 덜 수행됩니다. 

가비지 컬렉션은 특정 세대의 객체 수를 조사했을때 (세대가 증가할 수록 조사의 빈도는 감소합니다.) 지정한 임계를 넘었을 경우 트리거됩니다. (이 임계는 수정 가능합니다.)

또한 추가 최적화로 2세대 컬렉션이 수행되기 위해서는 0, 1세대 컬렉션에서 살아남은 객체의 수가 2세대 컬렉션에서 살아남은 객체 수의 25%를 넘어야 합니다.

### 순환 참조 감지 알고리즘

```c
// From pycore_gc.h

typedef struct {
    // _gc_next 필드와 _gc_prev 필드는 컬렉션 중과 전후에 용도가 다르게 사용됨 (메모리 최적화)
    uintptr_t _gc_next; 
    uintptr_t _gc_prev;
} PyGC_Head;

struct gc_generation {
    PyGC_Head head;
    int threshold;
    int count;
};

struct gc_generation_stats {
    Py_ssize_t collections;
    Py_ssize_t collected;
    Py_ssize_t uncollectable;
};

struct _gc_runtime_state {
    PyObject *trash_delete_later;
    int enabled;
    int debug;
    // NUM_GENERATIONS = 3
    struct gc_generation generations[NUM_GENERATIONS]; // 세대별 가비지 컬렉션 대상 객체 리스트를 가리키는 배열
    PyGC_Head *generation0;
    struct gc_generation permanent_generation;
    struct gc_generation_stats generation_stats[NUM_GENERATIONS];  // 세대별 상태 배열
    int collecting;
    PyObject *garbage;
    PyObject *callbacks;
    Py_ssize_t long_lived_total;
    Py_ssize_t long_lived_pending;
};
```

가비지 컬렉션을 지원하는 모든 객체는 `PyObject_GC_New` 등으로 생성되어 일반적인 PyObject 와는 다르게 `PyGC_Head` 구조체가 앞에 추가되어 있습니다. 이 `PyGC_Head` 구조체는 컬렉션 도중에는 참조 횟수로 초기화되는 컬렉션 참조 횟수와 객체가 도달 가능한지 등의 플래그를 저장하고 컬렉션이 진행되지 않을 때는 동일한 세대의 가비지 컬렉션 대상의 이중 연결 리스트를 만드는 데 이용됩니다. (태그드 포인터등의 메모리 최적화가 적용되어 있는 코드라 직관적이지는 않은 구조를 가지고 있음에 유의하시기 바랍니다.)

세대별 임계값을 넘어 컬렉션이 시작되면 가비지 컬렉션은 스레드의 가비지 컬렉션 상태에서 컬렉션을 수행하고자 하는 세대의 리스트를 찾아 순회하며 도달할 수 없는 객체를 찾기 시작합니다. (gcmodule.c의 `collect_generations` 함수 참조)

가비지 컬렉션은 리스트를 순회하며 컨테이너 객체가 참조하는 다른 컨테이너 객체의 컬렉션 참조 횟수를 감소시킵니다. 리스트 순회가 끝나게 되면 아직 외부에서 정상적으로 참조되고 있는 (변수에 할당되어 있는 등) 컨테이너 객체를 제외하고는 컬렉션 참조 횟수가 0이 되어 "아마도 도달 불가능" 하다는 플래그가 설정됩니다.

그러나 외부에서 직접 참조되고 있지 않아도 외부에서 정상적으로 참조하고 있는 객체들(컬렉션 참조 횟수가 0 이상인 객체들)에 의해 참조되고 있다면 참조 횟수가 0이어도 도달 가능하기 때문에 가비지 컬렉션은 그러한 객체들을 찾아 다시 "도달 가능" 플래그를 설정합니다.

이렇게 컬렉션 하고자 하는 세대의 모든 객체를 순회하여 살아있는 객체가 모두 찾아지고 난 후에도 "아마도 도달 불가능" 플래그가 설정되어 있는 컨테이너 객체는 진짜로 도달 불가능하다는 것이 확정되어 메모리에서 해제됩니다.

## JVM의 메모리 관리 방법과 비교

파이썬처럼 메모리의 할당과 해제를 자동으로 수행해주는 언어는 다양하지만 모두가 동일한 방법으로 메모리를 관리하지는 않습니다. 파이썬과 마찬가지로 서버사이드에서 많이 사용되는 JVM(HotSpot JVM, G1 GC 사용했을때 기준)과 비교해 보면 메모리 구조와 그 관리 방법에서 흥미로운 차이들을 발견할 수 있습니다.

파이썬과 JVM의 메모리 관리방법의 주요한 차이점은 바로 메모리를 해제하는 방법일 것입니다. 파이썬이 멀티스레드의 이점을 상당히 포기하게 만드는 GIL을 통해 레퍼런스 카운팅을 비싼 비용 없이 사용해 대부분의 메모리를 즉각 해제하고 순환 참조 해결을 위해서만 가비지 컬렉션을 사용하는 (순환 참조를 만들지 않는다면 GC를 아예 꺼도 됩니다.) 반면 JVM은 제한 없는 멀티스레드 사용이 가능한 대신 아토믹한 레퍼런스 카운팅을 사용하는 비용이 비싸 가비지 컬렉션만으로 더이상 필요없어진 객체들을 메모리에서 해제하고, 이때문에 Stop-The-World 시간이 발생하게 됩니다.

또한 메모리를 해제하는 것 이외에도 메모리를 정리하는 방법에 대해서도 JVM과 파이썬은 많은 차이가 있습니다. JVM은 Mark-Sweep-Compact 라고 불리는 가비지 컬렉션 과정을 통해 불필요한 객체를 메모리에서 해제하고 메모리를 정리하여 메모리의 파편화를 처리하지만 파이썬은 자체적인 메모리 압축 또는 정리를 지원하지 않습니다. 512바이트 이하 객체를 관리하는 pymalloc 할당자는 별도의 정리를 수행하지 않고 어쩌다 자연적으로 아레나가 비게 될 경우에만 아레나에 할당되었던 메모리를 운영체제로 반환하고, 512바이트 이상의 객체는 malloc으로 할당해 오직 malloc에서 자체적으로 제공하는 메모리 정리 기능으로만 메모리를 정리합니다. (그래서 glibc의 기본 malloc을 메모리 정리를 더 잘 수행하는 jemalloc등으로 교체하면 어느정도 메모리 최적화 효과를 볼 수 있습니다.)

또한 큰 객체에 대해서도 G1 GC를 사용하는 JVM은 단일 리전에 할당되지 못하는 큰 객체들은 여러 리전을 이어붙인 'humongous' 리전에 할당해 큰 객체도 JVM이 직접 관리하는 메모리 풀(힙) 에 저장하지만 파이썬은 그냥 단일 블록에 넣을수 없는 객체들은 메모리 풀에 할당하지 않고 malloc으로 바로 메모리에 할당합니다. 이렇게 JVM은 모든 객체들을 힙에 유지해 JVM 옵션으로 힙의 사이즈를 통제해서 JVM 프로세스가 사용할 최대 메모리를 제한할 수 있는 반면 파이썬은 메모리 풀만으로 모든 객체를 관리하지 않기 때문에 별도로 OS에서 파이썬 프로세스가 사용할 메모리를 제한하지 않는 한 파이썬 자체에서 메모리를 제한하지는 않습니다.

세부적으로 세대별 가비지 컬렉션을 위해 세대를 관리하는 방식에도 차이가 있는데 G1 GC를 사용하는 JVM은 힙이 고정 크기로 균등하게 분할된 리전들마다 세대가 지정되는 반면 파이썬의 가비지 컬렉션은 순환 참조를 일으킬 가능성이 있는 소수의 컨테이너 객체만을 대상으로 하기 때문에 메모리 구조와 별개로 스레드별 가비지 컬렉션 상태에 세대별로 객체들을 이중 연결 리스트로 묶어 관리합니다.

## 맺는말

사실 파이썬에서 메모리 관리는 조정할 수 있는 부분도 거의 없을뿐더러 대부분이 크게 중요하게 여기지 않습니다. JVM의 Stop-The-World 문제처럼 메모리 관리 방법이 프로그램 코드 실행에 많은 영향을 미치지 않을 뿐더러 애초부터 메모리 효율성이 중요한 분야에는 별로 사용되지 않는 탓이라고 생각하긴 합니다만, 그럼에도 불구하고 파이썬이 메모리를 어떻게 관리하는지 알게 되는 그 자체가 가치있는 일이라고 생각합니다.

읽어주셔서 감사합니다.

## 레퍼런스

### 메모리 관련 파이썬 소스코드

파이썬 소스코드 자체가 방대하다 보니 본 글에서 뭉게고 넘어간 디테일들이 꽤 있습니다. 더욱 자세하게 파이썬의 메모리 구조에 대해서 알고싶으신 분들은 다음의 파일들을 중심으로 소스코드를 직접 읽어보시는 것을 추천합니다.

* https://github.com/python/cpython/blob/master/Objects/obmalloc.c - 메모리 구조, 할당, 해제에 관련
* https://github.com/python/cpython/blob/master/Modules/gcmodule.c - 가비지 컬렉션 관련

### 참고문헌

* https://luavis.me/python/python-malloc
* https://rushter.com/blog/python-memory-managment/
* https://rushter.com/blog/python-garbage-collector/
* http://www.arctrix.com/nas/python/gc/
* https://www.quora.com/How-does-garbage-collection-in-Python-work-What-are-the-pros-and-cons
* https://pythoninternal.wordpress.com/2014/08/04/the-garbage-collector/
* https://docs.python.org/ko/3/faq/design.html
* https://pythondev.readthedocs.io/
* https://devguide.python.org/garbage_collector/
* https://realpython.com/cpython-source-code-guide
* https://realpython.com/python-memory-management
* https://www.oracle.com/technetwork/tutorials/tutorials-1876574.html
* https://perfectacle.github.io/2019/05/11/jvm-gc-advanced/
* https://docs.oracle.com/en/java/javase/12/gctuning/garbage-first-garbage-collector.html
* https://docs.python.org/ko/3/c-api/index.html
  * https://docs.python.org/ko/3/c-api/gcsupport.html
  * https://docs.python.org/ko/3/c-api/memory.html