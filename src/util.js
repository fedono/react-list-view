// 这种节流函数写的贼易懂
export function throttle(fn, delay) {
    let delayFlag = true;
    let firstInvoke = true;

    return function _throttle(e) {
        if (delayFlag) {
            delayFlag = false;
            setTimeout(() => {
                delayFlag = true;
                fn(e);
            }, delay);
            if (firstInvoke) {
                fn(e);
                firstInvoke = false;
            }
        }
    };
}
