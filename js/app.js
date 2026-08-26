import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


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
        console.log("No hay sesión activa");
        
        if (btnLogin) btnLogin.textContent = "Iniciar sesión con Google";

        ingresos.length = 0;
        egresos.length = 0;
        cargarCabecero();
        cargarIngresos();
        cargarEgresos();
    }
});

const iniciarSesionGoogle = async () => {
    try {
        if (usuarioActual) {
            await signOut(auth);
            console.log("Sesión cerrada correctamente");
        } else {
            await signInWithPopup(auth, provider);
        }
    } catch (error) {
        console.error("Error en la autenticación:", error);
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

const crearIngresoHTML = (ingreso) => {
    let ingresoHTML = `
    <div class="elemento limpiarAF">
        <div class="elemento_descripcion">${ingreso.descripcion}</div>
        <div class="derecha limpiarAF">
            <div class="elemento_valor">+ ${formatoMoneda(ingreso.valor)}</div>
            <div class="elemento_eliminar">
                <button class='elemento_eliminar--btn'>
                    <ion-icon name="close-circle-outline"
                    onclick="eliminarIngreso('${ingreso.id}')"></ion-icon>
                </button>
            </div>
        </div>
    </div>
    `;
    return ingresoHTML;
};

const eliminarIngreso = async (id) => {
    let indiceEliminar = ingresos.findIndex(ingreso => ingreso.id === id);
    
    if (usuarioActual && ingresos[indiceEliminar]?.id) {
        try {
            await deleteDoc(doc(db, "presupuesto", ingresos[indiceEliminar].id));
            await cargarDatosFirebase();
        } catch (error) {
            console.error("Error al eliminar de Firestore:", error);
        }
    } else {
        ingresos.splice(indiceEliminar, 1);
        cargarCabecero();
        cargarIngresos();
    }
};

const cargarEgresos = () =>{
    let egresosHTLM = '';
    for(let egreso of egresos){
        egresosHTLM += crearEgresoHTML(egreso);
    }
    document.getElementById('lista-egresos').innerHTML=egresosHTLM;
}

const crearEgresoHTML = (egreso) => {
    let egresoHTML = `
    <div class="elemento limpiarAF">
        <div class="elemento_descripcion">${egreso.descripcion}</div>
        <div class="derecha limpiarAF">
            <div class="elemento_valor">- ${formatoMoneda(egreso.valor)}</div>
            <div class="elemento_porcentaje">${formatoPorcentaje(egreso.valor/totalEgresos())}</div>
            <div class="elemento_eliminar">
                <button class='elemento_eliminar--btn'>
                    <ion-icon name="close-circle-outline"
                    onclick="eliminarEgreso('${egreso.id}')"></ion-icon>
                </button>
            </div>
        </div>
    </div>
    `;
    return egresoHTML;
};

const eliminarEgreso = async (id) => {
    let indiceEliminar = egresos.findIndex(egreso => egreso.id === id);
    
    if (usuarioActual && egresos[indiceEliminar]?.id) {
        try {
            await deleteDoc(doc(db, "presupuesto", egresos[indiceEliminar].id));
            await cargarDatosFirebase();
        } catch (error) {
            console.error("Error al eliminar de Firestore:", error);
        }
    } else {
        egresos.splice(indiceEliminar, 1);
        cargarCabecero();
        cargarEgresos();
    }
};

const cargarDatosFirebase = async () => {
    if (!usuarioActual) return;

    try {
        const q = query(collection(db, "presupuesto"), where("uid", "==", usuarioActual.uid));
        const querySnapshot = await getDocs(q);

        ingresos.length = 0;
        egresos.length = 0;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.tipo === "ingreso") {
                let ing = new Ingreso(data.descripcion, data.valor);
                ing._id = docSnap.id; // Asignamos usando _id
                ingresos.push(ing);
            } else if (data.tipo === "egreso") {
                let egr = new Egreso(data.descripcion, data.valor);
                egr._id = docSnap.id; // Asignamos usando _id
                egresos.push(egr);
            }
        });

        cargarCabecero();
        cargarIngresos();
        cargarEgresos();
    } catch (error) {
        console.error("Error al cargar datos desde Firestore:", error);
    }
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
