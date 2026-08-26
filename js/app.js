import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
let usuarioActual = null;

console.log("¡Firebase conectado correctamente!");

const ingresos = [
];

const egresos = [
];

onAuthStateChanged(auth, async (user) => {
    const btnLogin = document.querySelector(".btn-login");
    
    if (user) {
        usuarioActual = user;
        console.log("Sesión iniciada como:", user.displayName);
        
        if (btnLogin) btnLogin.textContent = `Hola, ${user.displayName.split(' ')[0]}`;
        
        await cargarDatosFirebase();
    } else {
        usuarioActual = null;
        if (btnLogin) btnLogin.textContent = "Iniciar sesión con Google";
        cargarApp();
    }
});

const iniciarSesionGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
    }
};


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

const cargarDatosFirebase = async () => {
    if (!usuarioActual) return;

    ingresos.length = 0;
    egresos.length = 0;

    const q = query(collection(db, "presupuesto"), where("uid", "==", usuarioActual.uid));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        let dato = doc.data();
        if (dato.tipo === "ingreso") {
            ingresos.push(new Ingreso(dato.descripcion, Number(dato.valor)));
        } else if (dato.tipo === "egreso") {
            egresos.push(new Egreso(dato.descripcion, Number(dato.valor)));
        }
    });

    cargarCabecero();
    cargarIngresos();
    cargarEgresos();
};

let agregarDato = async () => {
    let forma = document.forms["forma"];
    let tipo = forma["tipo"];
    let descripcion = forma["descripcion"];
    let valor = forma["valor"];

    if (descripcion.value !== "" && valor.value !== "") {
        if (usuarioActual) {
            await addDoc(collection(db, "presupuesto"), {
                uid: usuarioActual.uid,
                tipo: tipo.value,
                descripcion: descripcion.value,
                valor: Number(valor.value)
            });
            await cargarDatosFirebase();
        } else {
            if (tipo.value === "ingreso") {
                ingresos.push(new Ingreso(descripcion.value, +valor.value));
            } else if (tipo.value === "egreso") {
                egresos.push(new Egreso(descripcion.value, +valor.value));
            }
            cargarCabecero();
            cargarIngresos();
            cargarEgresos();
        }
        descripcion.value = "";
        valor.value = "";
    }
};

window.cargarApp = cargarApp;
window.agregarDato = agregarDato;
window.iniciarSesionGoogle = iniciarSesionGoogle;
window.eliminarIngreso = eliminarIngreso;
window.eliminarEgreso = eliminarEgreso;
