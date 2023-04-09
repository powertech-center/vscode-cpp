int dummy_func(void) {
    return 44;
}

int main(void) {
    return dummy_func() == 44 ? 0 : 1;
}
