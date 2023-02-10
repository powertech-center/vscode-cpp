
#include <stdio.h>
#include "foo.hpp"
#include "bar.hpp"


void Writeln(const char* message, int x)
{
    printf("%s: %d\n", message, x);
}

int main()
{
    Foo st;
    Writeln("static Foo", st.Func(5));

    Foo* d = new Foo();
    Writeln("dynamic Foo", d->Func(5));
    delete d;

    Bar b;
    Writeln("inline Bar", b.Inl(5));
    Writeln("noinline Bar", b.NoInl(5));
    Writeln("static Bar", Bar::Stat(5));

    return 0;
}