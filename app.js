import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9nqFyVXrLmgMC1PD-TjdAKwmvKNGvwVk",
  authDomain: "apppresupuestos-b7ab2.firebaseapp.com",
  projectId: "apppresupuestos-b7ab2",
  storageBucket: "apppresupuestos-b7ab2.firebasestorage.app",
  messagingSenderId: "72952921519",
  appId: "1:72952921519:web:74ada6176c449d66c2035a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("¡Firebase conectado correctamente!");

const ingresos = [
];

const egresos = [
];

let cargarApp = () => {
    cargarCabecero();
    cargarIngresos();
    cargarEgresos();
}

let totalIngresos = () => {
    let totalIngreso = 0;
    for(let ingreso of ingresos){
        totalIngreso += ingreso.valor;
    }
    return totalIngreso;
}

let totalEgresos = () => {
    let totalEgreso = 0;
    for(let egreso of egresos){
        totalEgreso += egreso.valor;
    }
    return totalEgreso;
}

let cargarCabecero = () => {
    let presupuesto = totalIngresos() - totalEgresos();
    let porcentajeEgreso = totalEgresos() / totalIngresos();
    document.getElementById('presupuesto').innerHTML = formatoMoneda (presupuesto);
    document.getElementById('porcentaje').innerHTML = formatoPorcentaje (porcentajeEgreso);
    document.getElementById('ingresos').innerHTML = formatoMoneda (totalIngresos());
    document.getElementById( 'egresos' ).innerHTML = formatoMoneda (totalEgresos());

}

const formatoMoneda = (valor) =>{
    return valor.toLocaleString('es-CO',{style:'currency', currency:'COP',  minimumFractionDigits:2});
}

const formatoPorcentaje = (valor) =>{
    return valor.toLocaleString('es-CO',{style:'percent',  minimumFractionDigits:1});
}

const cargarIngresos = () =>{
    let ingresosHTLM = '';
    for(let ingreso of ingresos){
        ingresosHTLM += crearIngresoHTML(ingreso);
    }
    document.getElementById('lista-ingresos').innerHTML=ingresosHTLM;
}

const crearIngresoHTML = (ingreso) =>{
    let ingresoHTLM = `
    <div class="elemento limpiarEstilos">
    <div class="elemento_descripcion">${ingreso.descripcion}</div>
    <div class="derecha limpiarEstilos">
        <div class="elemento_valor">${formatoMoneda(ingreso.valor)}</div>
        <div class="elemento_eliminar">
            <button class="elemento_eliminar--btn">
                <ion-icon name="remove-circle-outline"
                   onclick='eliminarIngreso(${ingreso.id})' 
                ></ion-icon>
            </button>
        </div>
    </div>
</div>
    `;
    return ingresoHTLM;
}

const eliminarIngreso = (id) => {
    let indiceEliminar = ingresos.findIndex(ingreso=> ingreso.id===id); //devuelve el indice del elemento que cumple la condicion, -1 si no lo encuentra
    ingresos.splice(indiceEliminar,1);
    cargarCabecero();
    cargarIngresos();
}

const cargarEgresos = () =>{
    let egresosHTLM = '';
    for(let egreso of egresos){
        egresosHTLM += crearEgresoHTML(egreso);
    }
    document.getElementById('lista-egresos').innerHTML=egresosHTLM;
}

const crearEgresoHTML = (egreso) =>{
    let egresoHTLM = `
    <div class="elemento limpiarEstilos">
        <div class="elemento_descripcion">${egreso.descripcion}</div>
        <div class="derecha limpiarEstilos">
            <div class="elemento_valor">${formatoMoneda(egreso.valor)}</div>
            <div class="elemento_porcentaje">${formatoPorcentaje(egreso.valor/totalEgresos())}</div>
            <div class="elemento_eliminar">
                <button class="elemento_eliminar--btn">
                    <ion-icon name="remove-circle-outline"
                    onclick='eliminarEgreso(${egreso.id})' 
                    ></ion-icon>
                </button>
            </div>
        </div>
    </div>
    `;
    return egresoHTLM;
}

let eliminarEgreso = (id) => {
    let indiceEliminar = egresos.findIndex(egreso=> egreso.id===id); //devuelve el indice del elemento que cumple la condicion, -1 si no lo encuentra
    egresos.splice(indiceEliminar,1);
    cargarCabecero();
    cargarEgresos();
}


let agregarDato = () =>{
    let forma = document.forms["forma"];
    let tipo = forma["tipo"];
    let descripcion = forma["descripcion"];
    let valor = forma["valor"];
    if(descripcion.value !== "" && valor.value !==""){
        if(tipo.value === "ingreso"){
            ingresos.push(new Ingreso(descripcion.value, +valor.value));
            cargarCabecero();
            cargarIngresos();
    }
    else if(tipo.value === "egreso"){
        egresos.push(new Egreso(descripcion.value, +valor.value));
            cargarCabecero();
            cargarEgresos();
    }
    }
}


window.cargarApp = cargarApp;
window.agregarDato = agregarDato;