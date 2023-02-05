# PowerTech C/C++ for VSCode

*Please note that the extension is under active development. We will be glad for your participation in the development, testing and voicing of proposals. Feel free in [Issues](https://github.com/powertech-center/vscode-cpp/issues), [Discussions](https://github.com/powertech-center/vscode-cpp/discussions) or in the telegram group [PowerTech C/C++ Beta](https://t.me/powercpp_beta).*

We care about Developers, so we create Simple, Powerful and Convenient tools for them. This Extension is intended for C/C++ Developers. We believe that the most functional, modern and promising compiler today is Clang ([LLVM](https://llvm.org) project), so we built our Extension relative to the Clang/LLVM infrastructure.

We are glad to offer you to download [PowerTech Clang](https://github.com/powertech-center/clang/tree/beta#readme) fork. You will get not only all the standard functionality, but also additional ones, such as *Build Speed Boost*, *Cross Compilation*, *C/C++ Language Extensions*, etc.

### Features
* Minimalistic interface
* C/C++ syntax highlighting and IntelliSense (based on [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) and [clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd))
* Debugging (based on [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools) and [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb))
* ToDo Remote launches
* ToDo Snippets

### Build systems
We are constantly working to improve our tools, keeping them Simple, and we really hope that they help Developers do their work more efficiently. We talked to the Developers, saw how many different build systems they use, and decided to support almost every one:
* CMake (based on [CMake](https://marketplace.visualstudio.com/items?itemName=twxs.cmake) and [CMake Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools))
* ToDo GN (based on [GN](https://marketplace.visualstudio.com/items?itemName=npclaudiu.vscode-gn))
* ToDo GYP (based on [GYP](https://marketplace.visualstudio.com/items?itemName=XadillaX.gyp))
* ToDo Visual Studio Project/Solution (emulation via GYP)
* ToDo Xcode Project (emulation via GYP)
* ToDo Ninja (base on [ninja syntax](https://marketplace.visualstudio.com/items?itemName=melak47.ninja-syntax))
* ToDo Makefile (base on [Makefile Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.makefile-tools))

In the process of incremental development, as a rule, only a small part of the files changes, and for comfortable work, it is necessary to track dependencies in a smart way and not perform unnecessary actions. Therefore, by default, we try to convert files from your build systems to ours based on GYP and Ninja. But in the launcher settings, you can always turn off our optimization and use the standard system. By the way, this Extension already contains all the necessary build system dependencies, so you don't need to install additional utilities (except Python if using GYP).

### Quick Start
ToDo

### Launching
ToDo

### Recommendations
We recommend that you install our [PowerTech Themes Extension](https://marketplace.visualstudio.com/items?itemName=PowerTech.powerthemes), which will help make your work more comfortable and inspiring:
* [PowerTech Dark/Light](https://github.com/powertech-center/vscode-themes/#powertech-dark-based-on-default-dark-theme)
* [IntelliJ IDEA Dark/Light](https://github.com/powertech-center/vscode-themes/#intellij-idea-dark-based-on-intellij-one-dark-theme)
* [Xcode Dark/Light](https://github.com/powertech-center/vscode-themes/#xcode-dark-based-on-xcode-theme)
* [Embarcadero Dark/Light](https://github.com/powertech-center/vscode-themes/#embarcadero-dark-based-on-delphi-themes)
* [Office Dark/Light](https://github.com/powertech-center/vscode-themes/#office-dark-based-on-office-theme)
* [CLion](https://github.com/powertech-center/vscode-themes/#clion-based-on-clion-plus-theme)
* [QtCreator](https://github.com/powertech-center/vscode-themes/#qtcreator-based-on-qtcreators-default-color-theme)
* [GitHub](https://github.com/powertech-center/vscode-themes/#github-based-on-github-light-theme)
* [Old-school DevC++](https://github.com/powertech-center/vscode-themes/#old-school-devc-based-on-dev-c-theme)
* [Old-school Borland](https://github.com/powertech-center/vscode-themes/#old-school-borland-based-on-delphi-themes)
* [Old-school DOS](https://github.com/powertech-center/vscode-themes/#old-school-dos-based-on-delphi-themes)

![](https://github.com/powertech-center/vscode-themes/raw/master/images/overview.png)