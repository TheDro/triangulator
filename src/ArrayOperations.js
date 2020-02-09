function subtract(arrA, arrB) {
    let result = []
    for (let ix=0; ix<arrA.length; ix++) {
        result.push(arrA[ix]-arrB[ix])
    }
    return result
}

function add(arrA, arrB) {
    try {

        let result = []
        for (let ix=0; ix<arrA.length; ix++) {
            result.push(arrA[ix]+arrB[ix])
        }
        return result
    } catch {
        console.log('arrA', arrA)
        console.log('arrB', arrB)
    }
}

function multiply(arr, arg) {
    let result = []
    if (Array.isArray(arg)) {
        for (let ix=0; ix<arr.length; ix++) {
            result.push(arr[ix]*arg[ix])
        }
    } else {
        for (let ix=0; ix<arr.length; ix++) {
            result.push(arr[ix]*arg)
        }
    }
    return result
}

export {add, subtract, multiply}