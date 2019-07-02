---
layout: post
title: '파이썬의 메타클래스'
image: img/metaclass.png
author: Seonghyeon Kim
date: 2019-03-28T10:00:00.000Z
tags:
  - Python
draft: false
---

## 일급 객체란?

메타클래스를 설명하기에 앞서 먼저 일급 객체의 개념을 알아야 합니다.

- 변수나 데이터 구조안에 담을 수 있다.
- 파라미터로 전달 할 수 있다.
- 반환값으로 사용할 수 있다.
- 할당에 사용된 이름과 관계없이 고유한 구별이 가능하다.
- 동적으로 프로퍼티 할당이 가능하다.

이상이 일급 객체의 조건입니다.

그리고 파이썬의 클래스는 이 모든 조건을 만족합니다.

```python
class A:
    pass

a = A
print(a)
# <class '__main__.A'>

def f(x):
    return x

f(A)

A.x = 3
```

이 점이 아주 중요합니다. 클래스도 객체입니다. 보통 인스턴스를 객체라고 하지만 파이썬에서는 클래스도 객체입니다.

## 메타클래스란 무엇일까?

객체 지향 프로그래밍에서 객체란 어떠한 클래스의 인스턴스를 가르킵니다. 그리고 앞에서 본 것처럼 파이썬에서 클래스는 객체입니다. 이말은 즉, 클래스 또한 무언가의 인스턴스란 뜻입니다. 그리고 이 클래스를 정의하는 클래스의 클래스를 **메타클래스**라고 합니다.

정의를 찾아보면 다음과 같이 표현되어 있습니다.

> 메타클래스란 **인스턴스가 클래스인 클래스**이다. 일반 클래스는 객체의 행동을 정의하지만 메타클래스는 클래스의 행동과 그 인스턴스의 행동들을 정의한다. 메타클래스는 클래스 또한 일급 객체로 취급함으로써 구현된다.

### 파이썬 메타클래스는 무엇인가

```python
class A:
    pass

a = A()

type(a)
# <class '__main__.A'>
type(A)
# <class 'type'>
type(type)
# <class 'type'> ???
```

파이썬에서 클래스를 만드는 메타클래스는 기본적으로 *type*입니다

타입 알아볼 때 쓰던 그 _type_ 맞습니다. 한 함수가 두가지 이상의 기능을 가지는 것은 분명히 이상하지만 metaclass가 아니라 "_type_" 인 이유는 PEP-3115를 찾아보면 다음과 같이 설명되어 있습니다.

> Josiah Carlson proposed using the name 'type' instead of 'metaclass', on the theory that **what is really being specified is the type of the type**. While this is technically correct, it is also confusing from the point of view of a programmer creating a new class. From the application programmer's point of view, the 'type' that they are interested in is the class that they are writing; the type of that type is the metaclass.

*type*이 클래스를 인스턴스로 가지는 메타클래스이라는 것을 이용하여, 즉 클래스는 객체이기 때문에 메타클래스 *type*을 이용하면 일반 객체를 만드는 것처럼 즉석으로 클래스를 만들 수 있습니다.

```python
MyClass = type("MyClass", (), {})

# SAME!
class MyClass:
    pass
```

참고로, type의 클래스는 type입니다. type 메타클래스는 자기 자신의 인스턴스입니다. 여기엔 cpython 내부트릭이 사용되기 때문에 내부를 살펴보시면 더욱 자세히 알 수 있습니다.

다음으로 메타클래스를 더 잘 알아보기 위해 파이썬이 클래스 정의를 실행할 때의 과정을 알아봅시다.

### 파이썬에서 클래스는 어떻게 정의되는가

[3. Data model - Python 3.7.3 documentation](https://docs.python.org/ko/3/reference/datamodel.html#customizing-class-creation)

파이썬 데이터 모델 문서를 보면 클래스 정의는 다음과 같은 과정을 거치면서 완성된다고 되어 있습니다.

- MRO 항목 결정
- 적절한 메타 클래스 결정
- **클래스 이름 공간 준비**
- 클래스 바디 실행
- **클래스 객체 생성**

여기서 포커스를 맞춰볼 것은 클래스 이름 공간 준비와 클래스 객체 생성 부분입니다.

```python
class Test:
    pass
```

따로 메타클래스를 지정해 주지 않았기 때문에 기본적으로 type()을 사용하여 클래스를 생성할 것입니다.

클래스 이름 공간을 준비하기 위해서 파이썬은 메타클래스의 \_\_prepare\_\_ 라는 메소드를 호출합니다. 이 메소드는 클래스 본문을 평가하는 동안 클래스 멤버 정의를 저장하는 데 사용되는 딕셔너리 객체를 반환합니다. 따로 오버라이딩하거나 하지 않았을 경우, 기본값은 빈 dict() 입니다.

```python
class MyMeta(type):
    @classmethod
    def __prepare__(mcs, name, bases, **kwargs):
        return {"x": 0}

class MyClass(metaclass=MyMeta):
    z = 1

    def f(self,):
        return x

print({k: v for k, v in MyClass.__dict__.items() if not k.startswith("__")})
# {'x': 0, 'z': 1, 'f': <function MyClass.f at 0x10efc8bf8>}
# 정의한적 없는 x가 생겼다!
```

이렇게 클래스 본문을 조작할 수 있습니다.

이름 공간이 준비되고, 클래스 본문이 실행되고 나서 마지막으로 클래스 객체를 생성하면서 클래스 정의가 마무리되게 됩니다.

클래스 객체는 메타클래스의 \_\_new** 를 실행하여 만들어집니다. 일반 클래스의 \_\_new** 는 인스턴스를 만들어내는 것처럼 메타클래스의 \_\_new\_\_ 는 메타클래스의 인스턴스인 클래스 객체를 만들어 냅니다.

```python
class MyMeta(type):
    def __new__(mcs, *args, **kwargs):
        print("new ", mcs, args, kwargs)
        r = super().__new__(mcs, *args, **kwargs)
        print(r)  # <class '__main__.MyClass'>
        return r

class MyClass(metaclass=MyMeta):
    z = 1

    def f(self, x):
        return x

# or...

MyClass2 = MyMeta("MyClass2", (), {"z":1})
```

추가로 클래스의 인스턴스 생성까지 메타클래스가 관여할 수 있습니다.

클래스의 \_\_call** 메서드는 인스턴스를 함수처럼 사용할 수 있게 해 줍니다. 메타클래스의 \_\_call** 은 메타클래스의 인스턴스는 클래스이기 때문에 클래스의 인스턴스를 생성할 때는 메타클래스의 \_\_call\_\_이 호출되게 됩니다.

```python
class MyMeta(type):
    def __call__(cls, *args, **kwargs):
        print("call ", cls, args, kwargs)
        x = super().__call__(*args, **kwargs)
        print(x)
        return x


class MyClass(metaclass=MyMeta):
    z = 1

    def f(self,):
        return x

MyClass()
# call  <class '__main__.MyClass'> () {}
```

## References

- [MongoEngine/mongoengine](https://github.com/MongoEngine/mongoengine/blob/master/mongoengine/base/metaclasses.py)

- [sqlalchemy/sqlalchemy](https://github.com/sqlalchemy/sqlalchemy/blob/master/lib/sqlalchemy/ext/declarative/api.py#L298)

- [What are some (concrete) use-cases for metaclasses?](https://stackoverflow.com/questions/392160/what-are-some-concrete-use-cases-for-metaclasses)

- [enum - Support for enumerations - Python 3.7.3rc1 documentation](https://docs.python.org/ko/3/library/enum.html)

- [Python Metaclasses - Real Python](https://realpython.com/python-metaclasses/)

- [What are metaclasses in Python?](https://stackoverflow.com/questions/100003/what-are-metaclasses-in-python)

- [Python metaclasses by example - Eli Bendersky's website](https://eli.thegreenplace.net/2011/08/14/python-metaclasses-by-example)

- [3. Data model - Python 3.7.3rc1 documentation](https://docs.python.org/ko/3/reference/datamodel.html)

- [Python Metaclasses and Metaprogramming](https://stackabuse.com/python-metaclasses-and-metaprogramming/)

- [pallets/flask](https://github.com/pallets/flask/blob/master/flask/views.py#L110)

- [PEP 3115 -- Metaclasses in Python 3000](https://www.python.org/dev/peps/pep-3115/)

- [파이썬 Special method 이해하기](https://www.slideshare.net/dahlmoon/specialmethod-20160403-70272494)

- [Python의 metaclasses(메타클래스) 이해하기](https://tech.ssut.me/understanding-python-metaclasses/)
