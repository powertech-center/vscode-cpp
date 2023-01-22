
#pragma once

class Bar
{
public:
    inline 
    int Inl(int X)
    {
        return X + 100500;
    }  
    
    __attribute__((noinline)) 
    int NoInl(int X)
    {
        return X + 100500;
    }

    static
    __attribute__((noinline)) 
    int Stat(int X)
    {
        return X + 100500;
    }   
};