const display = document.getElementById('display');

function appendToDisplay(value){
    display.value += value;
}

function clearDisplay(){
    display.value = '';
}

function clearsingleLastEntry(){
    display.value = display.value.slice(0, -1);
}

function calculateResult(){
    try{
        display.value = eval(display.value).toString();
    }catch (error){
        display.value = 'Error';
    }
}

function scientificFunction(input){
    display.value = parseFloat(display.value);

    if(!isNaN(display.value)){
        switch(input){
            case 'sin':
                display.value = Math.sin(display.value * Math.PI / 180).toString();
                break;
            case 'cos':
                display.value = Math.cos(display.value * Math.PI / 180).toString();
                break;
            case 'tan':
                display.value = Math.tan(display.value * Math.PI / 180).toString();
                break;
            case 'sqrt':
                display.value = Math.sqrt(display.value).toString();
                break;
            case 'log':
                display.value = Math.log10(display.value).toString();
                break;
            case 'ln':
                display.value = Math.log(display.value).toString();
                break;
        }
    } else {
        display.value = 'Error';
    }
    
}