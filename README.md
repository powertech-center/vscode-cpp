# PowerTech C/C++ for VSCode

***This Extension is under development, please wait a several weeks...***

We care about Developers, so we create Simple, Powerful and Convenient tools for them. This Extension is intended for C/C++ Developers. We believe that the most functional, modern and promising compiler today is Clang ([LLVM](https://llvm.org) project), so we built our Extension relative to the Clang/LLVM infrastructure.

We are glad to offer you to download __PowerTech Clang__ fork. You will get not only all the standard functionality, but also additional ones, such as *Build Speed Boost*, *Cross Compilation*, *C/C++ Language Extensions*, etc.

### Features
* ToDo C/C++ syntax highlighting and IntelliSense (based on [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) and [clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd))
* ToDo Debugging (based on [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) and [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb))
* ToDo Remote launches
* ToDo Support for unsaved files
* ToDo Snippets


### Build systems
We are constantly working to improve our tools, keeping them Simple, and we really hope that they help Developers do their work more efficiently. We talked to the Developers, saw how many different build systems they use, and decided to support almost every one:
* ToDo GN (based on [GN](https://marketplace.visualstudio.com/items?itemName=npclaudiu.vscode-gn))
* ToDo CMake (based on [CMake](https://marketplace.visualstudio.com/items?itemName=twxs.cmake) and [CMake Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools))
* ToDo GYP (based on [GYP](https://marketplace.visualstudio.com/items?itemName=XadillaX.gyp))
* ToDo Visual Studio Project/Solution (emulation via GYP)
* ToDo Xcode Project (emulation via GYP)
* ToDo Ninja (base on [ninja syntax](https://marketplace.visualstudio.com/items?itemName=melak47.ninja-syntax))
* ToDo Makefile (base on [Makefile Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.makefile-tools))

In the process of incremental development, as a rule, only a small part of the files changes, and for comfortable work, it is necessary to track dependencies in a smart way and not perform unnecessary actions. Therefore, by default, we try to convert files from your build systems to ours based on GYP and Ninja. But in the launcher settings, you can always turn off our optimization and use the standard system. By the way, this Extension already contains all the necessary build system dependencies, so you don't need to install additional utilities (except Python if using GYP).

### Recommendations
We recommend that you install our [PowerTech Themes](https://marketplace.visualstudio.com/items?itemName=PowerTech.powerthemes) Extension, which will help make your work more comfortable and inspiring:
* [PowerTech Dark](https://github.com/powertech-center/vscode-themes/#powertech-dark-based-on-default-dark-theme)
* [PowerTech Light](https://github.com/powertech-center/vscode-themes/#powertech-light-based-on-default-light-theme)
* [Old-school DevC++](https://github.com/powertech-center/vscode-themes/#old-school-devc-based-on-dev-c-theme)
* [Old-school Borland](https://github.com/powertech-center/vscode-themes/#old-school-borland-based-on-delphi-themes)
* [Old-school DOS](https://github.com/powertech-center/vscode-themes/#old-school-dos-based-on-delphi-themes)