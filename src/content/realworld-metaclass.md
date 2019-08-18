---
layout: post
title: '리얼월드 메타클래스'
image: img/realworld-metaclass.jpeg
author: Seonghyeon Kim
date: 2019-08-16T10:00:00.000Z
tags:
  - Python
draft: false
---

<iframe src="https://slides.com/seonghyeonkim/pyconkr-realworld-metaclass/embed" width="576" height="420" scrolling="no" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

이 글에서는 메타클래스가 무엇인지 알아보고, 파이썬에선 구체적으로 무슨 역할을 하고, 어떻게 활용할 수 있으며, 이미 어떻게 활용되고 있는지 알아볼 것입니다.

# PART A: 메타클래스란 무엇인가

많은 사람들이 메타클래스라는것의 존재도 모르거나, 이름은 들어봤는데 "몰라.. 무서워.." 라고 생각하시는 분들도 많습니다. 그런 분들을 위해 메타클래스란 무엇인지, 왜 필요한지부터 시작해 보도록 하겠습니다.

일단 메타클래스를 설명하기 위해선 파이썬의 데이터 모델에 대한 이해가 필요합니다.

파이썬에서 모든 것은 데이터를 추상화한 객체로 이루어져 있습니다. 그리고 그리고 파이썬의 객체는 아이덴티티, 값, 타입을 갖습니다.

아이덴티티는 객체의 수명 동안 유일하고 불변함이 보장되는 정수이며 id() 함수를 통해 얻을 수 있습니다.

값은 말 그대로 객체의 값으로 객체의 타입에 따라 불변할수도 있고 가변할 수도 있습니다.

타입은 객체가 지원하는 연산들을 정의하고 (예를 들어, "길이를 갖고 있나?") 그 타입의 객체들이 가질 수 있는 가능한 값들을 정의하면서 객체의 특성을 정의합니다. 객체의 타입은 type()을 통해 얻을 수 있으며 불변합니다.

이 객체의 세가지 요소 중 타입에 집중해 보려고 합니다.

기본적으로 파이썬에는 int타입, str 타입, bool 타입, float 타입, None 타입 등이 내장되어 있습니다. 그리고 파이썬의 기본적인 자료형을 가지는 객체들은 이 타입들에 의해 정의됩니다.

파이썬 프로그램을 만들면서 대부분의 경우엔 이 기본적으로 제공하는 타입들이 비즈니스 로직을 추상화 하기에 부족하기 때문에 우리는 새로운 타입들을 정의하게 됩니다. 바로 class라는 키워드를 사용해서 말입니다.

우리는 클래스를 만듬으로써 새로운 타입을 정의하고 정의한 타입으로 새로운 객체를 정의할 수 있습니다.

정리하자면, 파이썬에서 모든 객체들은 어떠한 타입에 의해 정의됩니다.

그런데 이게 메타클래스와 무슨 상관이 있을까요? 맨 처음에 파이썬의 모든 것들은 객체로 이루어져 있다고 했던 것을 기억하실 겁니다.

모든 것이 객체로 이루어져 있다. 모든 것, 어떤 것까지 객체인걸까요? 파이썬 데이터모델 문서에는 다음과 같이 적혀 있습니다.

> 객체는 파이썬이 데이터를 추상화한 것입니다. 파이썬 프로그램의 모든 데이터는 객체나 객체 간의 관계로 표현됩니다. **폰 노이만(Von Neumann)의 "프로그램 내장식 컴퓨터(stored program computer)" 모델을 따르고, 또 그 관점에서 코드 역시 객체로 표현됩니다.**

파이썬에선 모든 것이 객체로 표현되면서 코드 역시 객체로 표현된다고 합니다. 코드가 객체로 표현된다니 언뜻 보면 이해가 잘 가지 않습니다.

하지만 그렇게 어려운 뜻이 아닙니다. 우리가 짠 코드들은 변수, 함수, 클래스 등으로 이루어져 있습니다. 즉 함수, 클래스 등 모든 요소들이 객체라는 뜻입니다.

함수가 일급 객체라는 것은 다양한 곳에서 설명하고 있는 사실입니다. 그런데 과연 클래스도 객체일까요? 다른 언어에서 클래스는 대부분 객체를 생성하는 코드 조각, 바이트 코드의 일부분입니다.

객체인지 알아내는 것은 간단합니다. 파이썬의 모든 객체는 아이덴티티, 값, 타입을 가지니 클래스가 이 세가지 요소를 모두 가지고 있는지 확인하면 됩니다.

```python
>>> class C:
...    pass

>>> id(C)
140559438115784

>>> dir(C)
[ ... ]

>>> type(C)
<class 'type'>
```

id() 함수를 통해 아이덴티티를 가지는 것을 확인할 수 있고, dir()을 통해 어트리뷰트를 얻음으로써 값을 가진다는 것을 확인할수 있고, type()함수를 통해 타입을 가진다는 것을 확인할 수 있습니다.

그렇습니다, 파이썬에서의 클래스는 객체입니다.

잠깐, 객체? 객체라구요? 객체는 타입을 가진다고 했습니다. 그리고 타입은 객체를 정의한다고 했습니다. 즉, 클래스를 정의하는 타입이 있다는 말입니다.

그리고 바로 타입을 정의하는 타입이자 클래스를 인스턴스로 가지는 특별한 클래스를 **메타클래스** 라고 부릅니다.

그러면 파이썬에서는 무엇이 메타클래스일까요?

코드로 간단히 확인할 수 있습니다, type() 함수를 사용하여 타입(클래스)의 타입을 확인해 봅시다.

```python
>>> class C:
...    pass

>>> type(C)
<class 'type'>
```

결과에서 보이듯이 클래스 객체의 타입이 type()이므로 type()이 클래스 객체를 정의한다는 것을 보며 type()이 메타클래스라는 것을 알 수 있습니다.

type()은 객체의 타입을 가져오는 간단한 함수가 아니냐고 생각할 수도 있겠지만 놀랍게도 type 의 문서를 보면 type은 두가지 역할을 한다고 되어 있습니다.

type()이 한개의 인자를 가지고 호출될 때는 인자로 주어진 객체의 타입(클래스)를 가져오지만 세개의 인자를 가지고 호출될 때에는 새로운 타입(클래스) 객체를 돌려줍니다.

그리고 파이썬의 다른 타입들이 자유롭게 객체를 만들어 낼 수 있는 것과 같이 메타클래스를 사용하여 type()을 사용하여 새 타입을 정의할 수도 있습니다. 그리고 이것은 class 문을 사용하여 새 타입을 정의하는 것과 완전히 같은 결과를 돌려줍니다.

```python
>>> class X:
...     a = 1

>>> X = type('X', (object,), dict(a=1))
```

첫번째로 받는 name 파라미터는 클래스 이름이고 \_\_name** 어트리뷰트가 되고 두번째로 받는 bases 튜플은 베이스 클래스들을 항목화하고 \_\_bases** 어트리뷰트가 되며 세번째로 받는 dict 딕셔너리는 클래스 바디의 정의들이 들어있는 네임스페이스이며 \_\_dict\_\_ 어트리뷰트가 되도록 표준 딕셔너리에 복사됩니다.

# PART B: 파이썬에서 메타클래스의 역할

이제 메타클래스가 무엇인지, 파이썬에서의 메타클래스가 무엇인지도 분명히 알게되었습니다

파이썬에서 모든 것은 객체이고, 객체를 만드는 타입(클래스) 또한 객체이며 메타클래스인 type 이라는 타입에 의해 정의된다는 것을 알 수 있었습니다. 그렇다면 파이썬은 어떻게 type 타입을 사용해서 새로운 타입을 정의할까요?

파이썬에선 클래스 정의가 실행될 때 다음 과정들이 이루어집니다.

- MRO 항목 결정
- 적절한 메타 클래스를 결정
- 클래스 네임스페이스를 준비
- 네임스페이스 안에서 클래스 바디 실행
- 클래스 객체 생성

클래스 하나를 생성하고 각 단계를 따라가 보며 파이썬이 어떻게 메타클래스를 사용하여 새로운 타입을 정의하는지 알아봅시다.

```python
class MyClass:
    z = 1

    def f(self,):
        return x
```

클래스 정의가 들어있는 코드를 실행하면 먼저 파이썬은 C3 알고리즘을 사용해 메소드를 가져오는 순서인 Method Resolution Order(MRO)를 구성합니다.

MRO가 구성되면 클래스 정의를 위한 메타클래스를 결정합니다. 별도로 지정하지 않으면 기본 메타클래스인 type이 사용되기 때문에 여기에서는 type이 메타클래스로 결정되어 새로운 타입을 정의할 것입니다.

이제 type이 메타클래스로 결정되었고 파이썬은 메타클래스에서 네임스페이스를 준비하는 \_\_prepare\_\_ 어트리뷰트를 호출하여 반환받은 매핑으로 네임스페이스를 정의할 것입니다. 만약 메타클래스에 \_\_prepare\_\_ 어트리뷰트가 없다면 빈 순서있는 매핑이 대신 사용됩니다.

```python
from collections import OrederedDict

class MyMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        return OrderedDict()

class MyClass(metaclass=MyMeta):
    z = 1
    def f(self,):
        return x

print({k: v for k, v in MyClass.__dict__.items() if not k.startswit("__")})

# {'z': 1, 'f': <function MyClass.f at 0x10efc8bf8>}
```

네임스페이스가 정의되면 exec() 함수를 사용하여 바디를 실행하여 바디 속에 들어있는 함수 정의, 변수 할당 등을 수행하여 클래스의 네임스페이스를 채웁니다.

그 후 마지막으로 클래스 객체가 완성이 되는데 일반적인 클래스가 인스턴스를 만들 때처럼 파이썬은 메타클래스의 \_\_new\_\_ 를 사용하여 메타클래스의 인스턴스인 클래스 객체를 만들어 냅니다.

```python
class MyMeta(type):
    def __new__(mcs, *args, **kwargs):
        print("new ", mcs, args, kwargs)
        r = super().__new__(mcs, *args, **kwargs)

        return r


class MyClass(metaclass=MyMeta):
    z = 1

    def f(self, x):
        return x


# new  <class '__main__.MyMeta'> ('MyClass', (), {'__module__':
'__main__', '__qualname__': 'MyClass', 'z': 1, 'f': <function
MyClass.f at 0x101cc89d8>}) {}

# same as type('MyClass', (), {...})
```

그리고, 파이썬 3.6 이상에서 메타클래스는 객체를 생성할 때 디스크립터 객체를 수집하여 \_\_set_name\_\_ 훅을 실행하여 디스크립터와 네임스페이스가 연결 될 수 있게 합니다.

이제 클래스 객체 생성이 모두 완료되었습니다. 파이썬은 코드를 읽어들인 후 메타클래스를 사용해 네임스페이스를 정의하였고, 그 네임스페이스에서 바디를 실행했고, 그 후 메타클래스의 \_\_new\_\_ 를 사용하여 객체를 생성했습니다.

그러나 메타클래스는 이것 외에도 한가지에 더 관여할 수 있습니다.

일반적으로 클래스의 인스턴스를 callable하게 만들 때, 우리는 클래스의 \_\_call\_\_ 을 오버라이드 합니다. 그런데 메타클래스의 \_\_call\_\_ 은 어디에 쓰일까요?

```python
class MyClass:
    def __call__(self, *args, **kwargs):
        return "this is callable"

v = MyClass()()

print(v)

# this is callable
# however...

class MyMeta(type):
    _ = ""

v = MyMeta("MyClass2", (), {"v": 42})()

print(v)

# <__main__.MyClass2 object at 0x1104574a8>
```

메타클래스는 클래스의 인스턴스 생성에도 관여하고, 메타클래스의 \_\_call\_\_ 은 클래스가 인스턴스를 만들 때 호출되게 됩니다.

# Part C: 메타클래스를 활용하기

이제는 메타클래스를 활용해볼 시간입니다. 앞선 내용에서는 메타클래스가 클래스 생성에 어느정도로, 어떻게 관여하는지 알아보았습니다.

이제 우리는 앞선 내용을 가지고 메타클래스를 상속받아 클래스 생성을 변경하여 몇가지 흥미로운 기능을 구현해볼 수 있습니다.

## 메타클래스를 상속해보기

메타클래스를 상속받아 원하는 방식으로 클래스 생성을 변경하기 위해 다음의 메소드를 오버라이드 할 수 있습니다

- \_\_prepare\_\_
- **\_\_new\_\_**
- \_\_init\_\_
- **\_\_call\_\_**

## 서브클래스 검증

\_\_new\_\_ 메소드에 클래스 객체를 검증하는 코드를 삽입하여 클래스가 생성될 때 올바르게 생성되었는지 검사할 수 있습니다

대표적인 예로 클래스가 똑바로 상속이 되었는지, 특정 애트리뷰트를 가지고 있는지 체크할 수 있습니다

### 상속 검증

\_\_new\_\_의 두번째 인자는 부모 클래스들을 담은 튜플입니다. 이를 이용해 다중 상속을 금지하는 메타클래스를 만들어 봅시다.

```python
class DisallowMultipleInheritance(type):
    def __new__(mcs, *args, **kwargs):
        if len(args[1]) > 1:
            raise Exception(f"Can't be subclassed withmultiple inheritance: {args[1]}")
        r = super().__new__(mcs, *args, **kwargs)
        return r


class Foo(metaclass=DisallowMultipleInheritance):
    pass


class Bar:
    pass


class Zee(Foo, Bar):
    pass

# Expected results:
# Exception: Can't be subclassed with multipleinheritance: (<class '__main__.Bar'>, <class'__main__.Foo'>)
```

이 메타클래스는 베이스 튜플을 체크하여 베이스 클래스가 두가지 이상이라면 예외를 발생시킵니다.

그리고 이것을 응용하여 아예 클래스 상속을 금지시킬 수도 있습니다.

```python
class DisallowInheritance(type):
    def __new__(mcs, *args, **kwargs):
        cls = [c for c in args[1] if isinstance(c, mcs]
        if args[1]:
            raise Exception(f"Can't subclass thisclasses: {cls}")
        r = super().__new__(mcs, *args, **kwargs)
        return r


class Foo(metaclass=DisallowInheritance):
    pass


class Bar(Foo):
    pass

# Expected results:
# Exception: Can't subclass this classes: [<class'__main__.Foo'>]
```

이 메타클래스를 메타클래스로 지정한 클래스를 상속받으려 하면 예외가 발생할 것입니다.

### 애트리뷰트 검증

우리가 기대하는 대로 클래스가 작성되었는지 컴파일 타임에 검증하는 것 또한 가능합니다

다음은 장고 모델폼의 예시입니다.

```python
class UserForm(ModelForm):
    class Meta:
        model = User
        fields = ['name', 'email', 'birth_date']
```

이 Meta라는 내부 클래스가 구현이 되어있지 않다면 장고 앱은 시작할 수 없습니다.

이처럼 프로그램 시작 전에 애트리뷰트를 가지고 있는지 검사하는 메타클래스를 만들어 봅시다.

```python
class CheckMeta(type):
    def __new__(mcs, *args, **kwargs):
        name, bases, namespace = args

        if (not namespace.get("Meta", None)) and (bases != ()):
            raise Exception("Can not configure class. Meta is missing")

        r = super().__new__(mcs, *args, **kwargs)

        return r
```

Meta가 있는지 체크하고, 없다면 예외를 발생시킵니다.

## 싱글톤

\_\_call\_\_ 메소드를 편집하여 서브클래스의 생성자가 호출될 때 같은 객체만을 돌려주도록 할 수 있습니다

싱글톤으로 메타클래스를 구현하는것은 간단합니다. \_\_call\_\_ 을 부를 때 클래스를 키로, 인스턴스를 밸류로 두는 딕셔너리에서 한번 만들어진 인스턴스를 계속 돌려주도록 할 수 있습니다.

```python
class Singleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(...)

        return cls._instances[cls]
```

```python
>>> class C(metaclass=Singleton):
...    pass

>>> a = C()

>>> b = C()

>>> print(a is b)
 True
```

객체를 몇번을 만들어도 인스턴스가 같다는 것을 알 수 있습니다.

## 디스크립터와 네임스페이스를 자동으로 연결하기 (Python 3.6부터는 내장)

파트 B에서 \_\_new\_\_ 를 소개할 때 디스크립터의 \_\_set_name\_\_ 훅에 대한 이야기를 잠깐 했었는데, 먼저 디스크립터라는게 무엇인지 간단히 소개하자면 property와 유사하지만 데코레이터가 아닌 클래스 기반으로 게터와 셋터를 구현하는 일종의 프로토콜입니다

\_\_set_name\_\_ 훅이 디스크립터 프로토콜에 추가된 것은 3.6 부터로 그 이전 버전에는 디스크립터를 상당히 불편하게 사용해야 했습니다.

디스크립터가 사용된 간단한 클래스입니다.

```python
class Product:
    price = Price(name="price", unit="KRW")
```

덕지덕지 데코레이터가 붙은 겟터와 셋터가 아닌 이렇게 SQLAlchemy나 Django ORM 의 필드 정의같은 모양을 하고 있습니다 (실제로 그 필드 구현은 디스크립터이기도 합니다)

그리고 일반적인 겟터 셋터와 같이 동작합니다.

```python
>>> pd = Product()

>>> pd.price = "NotANumber"
Please set a valid integer

>>> pd.price = 5000

>>> print(pd.price)
5,000 KRW
```

그런데 3.5까지는 아까 전처럼 name이라는 이름의 파라미터 등으로 네임스페이스에서 뽑아올 값의 키 이름을 지정해 줘야만 했습니다.

별로 좋은 모양은 아닙니다, 저희는 중복을 싫어하니까요.

그래서 파이썬은 이 중복을 제거하기 위해 3.6부터 \_\_set_name\_\_이란 훅을 디스크립터 프로토콜에 추가하고 메타클래스가 이 훅을 자동으로 트리거해 네임스페이스에서 가져올 키의 이름을 지정해 줍니다.

PEP-484가 이 새로운 디스크립터 프로토콜이 소개된 제안인데, 여기에 나온 구현안을 보고 약간 간략화 돤 버전으로 구현해 보도록 하겠습니다

```python
class Meta(type):
    def __new__(mcs, *args, **kwargs):
        name, bases, namespace = args

        self = super().__new__(mcs, name, bases, namespace)

        for k, v in self.__dict__.items():
            func = getattr(v, '__set_name__', None)
            if func is not None:  # trigger hook if exists
                func(self, k)

        return self
```

이 메타클래스는 \_\_set_name\_\_을 가지고 있다면 그 훅을 가지고 있는 어트리뷰트의 이름을 어트리뷰트에 할당된 디스크립터가 네임스페이스에서 가져올 이름으로 지정해 주게 됩니다.

디스크립터에는 다음과 같이 표준 디스크립터 프로토콜을 따라 훅을 정의해 봅시다.

```python
class Desc:
    def __get__(self, instance, owner):
        return instance.__dict__[self.name]

    def __set__(self, instance, value):
        instance.__dict__[self.name] = value

    def __set_name__(self, owner, name):
        self.name = name
```

```python
class C(metaclass=Meta):
    v = Desc()
```

기대하던 대로 잘 동작하며 중복되는 부분이 없어 깔끔해진 디스크립터를 볼 수 있습니다.

# Part D: 오픈소스에서의 메타클래스

마지막 파트입니다. 과연 메타클래스는 어디서 쓰이고 있을까요? 친숙한 오픈소스 라이브러리들은 사실 오래 전부터 메타클래스를 활용하고 있습니다. 과연 어떻게 쓰이는지 셀러리와 장고에서 찾아보도록 합시다.

## Celery(v2.6)에서의 메타클래스

첫번째는 셀러러 2.6버전의 예시입니다

셀러리는 바로 처리하기 어려운 작업을 비동기로 처리하기 위한 작업 큐로 큐로, 태스크를 만들어 브로커에 전달하면 워커가 작업을 처리한 후 지정한 곳으로 결과 반환을 하는 구조로 만들어져 있습니다

이때 태스크를 보통은 데코레이터로 만들지만 클래스로 만들기도 하는데, 4.0 버전 이전에서는 이 Task 클래스를 상속받아 태스크를 만들면 자동으로 앱에 태스크가 등록되었습니다.

셀러리의 Task 클래스는 [TaskType](https://github.com/ask/celery/blob/master/celery/app/task.py#L95-L157)이란 메타클래스를 가지고 있습니다.

이 TaskType은 새로 구현된 Task에 대한 몇가지 검증을 거친 후 이름이 없다면 이름을 자동으로 부여하고 현재 맥락의 앱에 정의된 태스크를 자동으로 등록합니다.

```python
class TaskType(type):
    def __new__(cls, name, bases, attrs):
        # get __new__ form super
        # get app from attrs. if not exists, get from current_app
        # automatically generate missing/empty name.

        ...

        tasks = app._tasks

        ...

        task_name = attrs["name"]

        if task_name not in tasks:
            tasks.register(new(cls, name, bases, attrs))

        instance = tasks[task_name]
        instance.bind(app)

        return instance.__class__
```

## Django에서의 메타클래스

파이썬을 장고로 입문하는 사람이 있을 정도로 유명한 라이브러리인 장고에서도 메타클래스를 많이 활용하고 있습니다.

대표적인 예가 모델과 폼인데 여기서는 폼이 좀 더 간단하기 때문에 폼에서 쓰이는 메타클래스에 대하여 알아보려고 합니다.

폼을 만들때 상속받는 [폼 클래스](https://github.com/django/django/blob/af08a54415/django/forms/forms.py#L495)는 [DeclarativeFieldsMetaclass](https://github.com/django/django/blob/af08a54415/django/forms/forms.py#L25)라는 메타클래스를 상속받고 있습니다.

이 메타클래스는 폼을 정의할때 사용한 필드들을 메타클래스에서 자동으로 수집합니다.

```python
class DeclarativeFieldsMetaclass(MediaDefiningClass):
    """Collect Fields declared on the base classes."""
    def __new__(mcs, name, bases, attrs):
        # Collect fields from current class.
        current_fields = []
        for key, value in list(attrs.items()):
            if isinstance(value, Field):
                current_fields.append((key, value))
                attrs.pop(key)
        attrs['declared_fields'] = dict(current_fields)

        new_class = super(DeclarativeFieldsMetaclass, mcs).__new__(mcs, name, bases, attrs)

        # Walk through the MRO.
        declared_fields = {}

        ...

        new_class.base_fields = declared_fields
        new_class.declared_fields = declared_fields

        return new_class
```

이렇게 필드를 상속받은 애트리뷰트를 모두 뽑아내 필드를 뽑아내어 등록합니다.

그리고 모델폼에서도 메타클래스는 유용하게 사용되고 있습니다.

파트 C에서 모델폼의 예시를 들면서 클래스를 검증하는것을 설명했는데, 사실 그것과 같은 내용입니다. ModelForm을 사용할때 몇가지 설정을 Meta라는 내부 클래스로 정의하게 되는데 [ModelFormMetaclass](https://github.com/django/django/blob/af08a54415/django/forms/models.py#L207)라는 모델폼의 메타클래스가 이 Meta 안에 들어있는 설정을 보고 폼을 구성합니다.

일단 메타클래스는 클래스 정의에서부터 메타를 뽑아냅니다.

```python
class ModelFormMetaclass(DeclarativeFieldsMetaclass):
    def __new__(mcs, name, bases, attrs):
        base_formfield_callback = None
        for b in bases:
            if hasattr(b, 'Meta') and hasattr(b.Meta, 'formfield_callback'):
                base_formfield_callback = b.Meta.formfield_callback
                break

        formfield_callback = attrs.pop('formfield_callback', base_formfield_callback)

        new_class = super(ModelFormMetaclass, mcs).__new__(mcs, name, bases, attrs)

        if bases == (BaseModelForm,):
            return new_class

        opts = new_class._meta = ModelFormOptions(getattr(new_class, 'Meta', None))

        ...
```

그리고 예를 들면 fields에 `("foo", )` 대신 `("foo")` 를 넣었을 경우등 을 체크해 이 메타가 올바른 형식인지 확인합니다.

```python
class ModelFormMetaclass(DeclarativeFieldsMetaclass):
    def __new__(mcs, name, bases, attrs):
        ...

        # We check if a string was passed to `fields` or `exclude`,
        # which is likely to be a mistake where the user typed ('foo') instead
        # of ('foo',)
        for opt in ['fields', 'exclude', 'localized_fields']:
            value = getattr(opts, opt)
            if isinstance(value, str) and value != ALL_FIELDS:
                msg = ("%(model)s.Meta.%(opt)s cannot be a string. "
                       "Did you mean to type: ('%(value)s',)?" % {
                           'model': new_class.__name__,
                           'opt': opt,
                           'value': value,
                       })
                raise TypeError(msg)

        ...
```

그리고 모델이란 어트리뷰트로 정의된 폼과 연결될 장고 모델에서 필드를 가져오기도 합니다.

```python
class ModelFormMetaclass(DeclarativeFieldsMetaclass):
    def __new__(mcs, name, bases, attrs):
        ...

        if opts.model:
            # If a model is defined, extract form fields from it.

            # make sure opts.fields doesn't specify an invalid field

            # Override default model fields with any custom declared ones
            # (plus, include all the other declared fields).
            ...
            fields.update(new_class.declared_fields)
        else:
            fields = new_class.declared_fields

        new_class.base_fields = fields

        return new_class
```

모델을 가져와서 필드를 추출하고, Meta에 정의된 필드 중 이상한 값은 없는지 체크하는 등등의 작업을 한 후 필드들을 폼 클래스에 등록합니다.
