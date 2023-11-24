function gaussian() {
    let s = 0;
    for (let c=0; c<16; c++) s+=Math.random();
    return (s-8)/4;
}

function clamp(number, min, max) {
    if (number<min) return min;
    else if (number>max) return max;
    else return number;
}

function moveTowards_1(current, target, amount) {
    if (current<target) return Math.min(current+amount, target);
    else return Math.max(current-amount, target);
}

function moveTowards_2(current, target, amountUp, amountDown) {
    if (current<target) return Math.min(current+amountUp, target);
    else return Math.max(current-amountDown, target);
}

module.exports = {
    gaussian,
    clamp,
    moveTowards_1,
    moveTowards_2
}