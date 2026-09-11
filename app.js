/* =========================================================
   INVENTRA PRO
   Developer : Ju5t Fun
   File      : app.js
   Version   : Production v1.0
========================================================= */


/* =========================================================
   1. SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
  "YOUR_SUPABASE_URL";

const SUPABASE_KEY =
  "YOUR_SUPABASE_ANON_KEY";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   2. GLOBAL STATE
========================================================= */

let barangEditId = null;
let supplierEditId = null;

let autoRefreshTimer = null;

let isSavingBarang = false;
let isSavingSupplier = false;
let isSavingTransaksi = false;
let isSavingOpname = false;


/* =========================================================
   3. BASIC UTILITIES
========================================================= */

function getValue(id){

  const el =
    document.getElementById(id);

  if(!el){
    return "";
  }

  return String(
    el.value ?? ""
  ).trim();
}


function setValue(id,value){

  const el =
    document.getElementById(id);

  if(el){
    el.value = value ?? "";
  }

}


function escapeHTML(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


function formatDate(value){

  if(!value){
    return "-";
  }

  const date =
    new Date(value);

  if(
    Number.isNaN(
      date.getTime()
    )
  ){
    return "-";
  }

  return date.toLocaleString(
    "id-ID",
    {
      dateStyle:"medium",
      timeStyle:"short"
    }
  );

}


function getTodayString(){

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth()+1
    ).padStart(2,"0");

  const day =
    String(
      now.getDate()
    ).padStart(2,"0");

  return `${year}-${month}-${day}`;

}


function debounce(
  callback,
  delay = 300
){

  let timer = null;

  return function(...args){

    clearTimeout(timer);

    timer =
      setTimeout(
        ()=>{
          callback.apply(
            this,
            args
          );
        },
        delay
      );

  };

}


function setButtonLoading(
  buttonId,
  loading,
  loadingText = "Menyimpan..."
){

  const button =
    document.getElementById(
      buttonId
    );

  if(!button){
    return;
  }

  if(loading){

    if(
      !button.dataset.originalText
    ){

      button.dataset.originalText =
        button.innerHTML;

    }

    button.disabled = true;

    button.innerHTML =
      loadingText;

  }else{

    button.disabled = false;

    button.innerHTML =
      button.dataset.originalText ||
      "Simpan";

    delete button.dataset.originalText;

  }

}


/* =========================================================
   4. TOAST
========================================================= */

let toastTimer = null;

function showToast(message){

  const toast =
    document.getElementById(
      "toast"
    );

  if(!toast){

    console.log(
      message
    );

    return;

  }

  toast.innerText =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    toastTimer
  );

  toastTimer =
    setTimeout(
      ()=>{

        toast.classList.remove(
          "show"
        );

      },
      3000
    );

}


/* =========================================================
   5. LOADING SCREEN
========================================================= */

window.addEventListener(
  "load",
  ()=>{

    const loading =
      document.getElementById(
        "loadingScreen"
      );

    if(!loading){
      return;
    }

    setTimeout(
      ()=>{

        loading.style.display =
          "none";

      },
      500
    );

  }
);


/* =========================================================
   6. LOGIN
========================================================= */

async function loginAdmin(){

  const email =
    getValue(
      "loginEmail"
    );

  const password =
    document.getElementById(
      "loginPassword"
    )?.value || "";


  if(!email || !password){

    const status =
      document.getElementById(
        "loginStatus"
      );

    if(status){
      status.innerText =
        "Email dan password wajib diisi";
    }

    return;

  }


  const loginButton =
    document.getElementById(
      "btnLogin"
    );

  if(loginButton){

    loginButton.disabled = true;
    loginButton.innerText =
      "Memproses...";

  }


  try{

    const {
      error
    } =
      await supabaseClient
      .auth
      .signInWithPassword({

        email,
        password

      });


    if(error){

      const status =
        document.getElementById(
          "loginStatus"
        );

      if(status){
        status.innerText =
          error.message;
      }

      return;

    }


    const status =
      document.getElementById(
        "loginStatus"
      );

    if(status){
      status.innerText = "";
    }


    await showApplication();

  }catch(error){

    console.error(
      "Login error:",
      error
    );

    const status =
      document.getElementById(
        "loginStatus"
      );

    if(status){

      status.innerText =
        "Login gagal. Silakan coba lagi.";

    }

  }finally{

    if(loginButton){

      loginButton.disabled =
        false;

      loginButton.innerText =
        "Login";

    }

  }

}


/* =========================================================
   7. LOGOUT
========================================================= */

async function logoutAdmin(){

  stopAutoRefresh();

  await supabaseClient
    .auth
    .signOut();

  location.reload();

}


/* =========================================================
   8. SESSION
========================================================= */

async function checkSession(){

  try{

    const {
      data,
      error
    } =
      await supabaseClient
      .auth
      .getSession();


    if(error){

      console.error(
        "Session error:",
        error
      );

      return;

    }


    if(data?.session){

      await showApplication();

    }

  }catch(error){

    console.error(
      "Check session:",
      error
    );

  }

}


async function showApplication(){

  const loginPage =
    document.getElementById(
      "loginPage"
    );

  const app =
    document.getElementById(
      "app"
    );


  if(loginPage){

    loginPage.classList.add(
      "hidden"
    );

  }


  if(app){

    app.classList.remove(
      "hidden"
    );

  }


  await initApp();

}


/* =========================================================
   9. SPA NAVIGATION
========================================================= */

function showPage(pageId){

  document
    .querySelectorAll(".page")
    .forEach(
      page=>{

        page.classList.add(
          "hidden"
        );

      }
    );


  const target =
    document.getElementById(
      pageId
    );


  if(target){

    target.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   10. INITIALIZE APP
========================================================= */

let appInitialized = false;


async function initApp(){

  if(appInitialized){

    await refreshAllData();

    return;

  }


  appInitialized = true;


  try{

    /*
      Jalankan request independen
      secara bersamaan.
    */

    await Promise.allSettled([

      loadDashboard(),

      loadBarang(),

      loadSupplier(),

      loadBarangMasuk(),

      loadBarangKeluar(),

      loadActivity(),

      loadSelectBarang(),

      loadSelectOpname(),

      loadStockOpname()

    ]);


    startAutoRefresh();


  }catch(error){

    console.error(
      "Init app:",
      error
    );

  }

}


/* =========================================================
   11. DASHBOARD
========================================================= */

async function loadDashboard(){

  try{

    const [
      barangResult,
      masukResult,
      keluarResult
    ] =
      await Promise.all([

        supabaseClient
          .from("barang")
          .select(
            "id,kode,nama,kategori,stok,stok_minimum"
          ),

        supabaseClient
          .from("barang_masuk")
          .select("id"),

        supabaseClient
          .from("barang_keluar")
          .select("id")

      ]);


    if(barangResult.error){
      throw barangResult.error;
    }

    if(masukResult.error){
      throw masukResult.error;
    }

    if(keluarResult.error){
      throw keluarResult.error;
    }


    const barang =
      barangResult.data || [];

    const masuk =
      masukResult.data || [];

    const keluar =
      keluarResult.data || [];


    const totalBarang =
      barang.length;


    const totalStok =
      barang.reduce(
        (sum,item)=>
          sum +
          Number(item.stok || 0),
        0
      );


    const stokMenipis =
      barang.filter(
        item=>
          Number(item.stok || 0) <=
          Number(
            item.stok_minimum || 0
          )
      ).length;


    setText(
      "totalBarang",
      totalBarang
    );

    setText(
      "totalStok",
      totalStok
    );

    setText(
      "totalMasuk",
      masuk.length
    );

    setText(
      "totalKeluar",
      keluar.length
    );

    setText(
      "stokMenipis",
      stokMenipis
    );


    let html = "";


    barang
      .slice(0,10)
      .forEach(
        item=>{

          html += `

          <tr>

            <td>
              ${escapeHTML(
                item.kode
              )}
            </td>

            <td>
              ${escapeHTML(
                item.nama
              )}
            </td>

            <td>
              ${escapeHTML(
                item.kategori || "-"
              )}
            </td>

            <td>
              ${Number(
                item.stok || 0
              )}
            </td>

          </tr>

          `;

        }
      );


    const table =
      document.getElementById(
        "dashboardBarang"
      );


    if(table){

      table.innerHTML =
        html;

    }

  }catch(error){

    console.error(
      "Dashboard:",
      error
    );

  }

}


function setText(
  id,
  value
){

  const element =
    document.getElementById(
      id
    );

  if(element){

    element.innerText =
      value;

  }

}


/* =========================================================
   12. BARANG MODAL
========================================================= */

function openBarangModal(){

  /*
    PENTING:
    Jangan reset barangEditId di sini.
    Karena fungsi ini juga dipanggil ketika EDIT.
  */

  const modal =
    document.getElementById(
      "barangModal"
    );

  if(modal){

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeBarangModal(){

  const modal =
    document.getElementById(
      "barangModal"
    );

  if(modal){

    modal.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   13. LOAD BARANG
========================================================= */

async function loadBarang(){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("barang")

      .select(
        "*"
      )

      .order(
        "id",
        {
          ascending:false
        }
      );


    if(error){

      throw error;

    }


    let html = "";


    (data || [])
      .forEach(
        item=>{

          html += `

          <tr>

            <td>
              ${escapeHTML(
                item.kode
              )}
            </td>

            <td>
              ${escapeHTML(
                item.nama
              )}
            </td>

            <td>
              ${escapeHTML(
                item.kategori || "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                item.supplier || "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                item.rak || "-"
              )}
            </td>

            <td>
              ${Number(
                item.stok || 0
              )}
            </td>

            <td>
              ${Number(
                item.stok_minimum || 0
              )}
            </td>

            <td>

              <button
              type="button"
              onclick="editBarang(${item.id})">

                Edit

              </button>

              <button
              type="button"
              onclick="hapusBarang(${item.id})">

                Hapus

              </button>

            </td>

          </tr>

          `;

        }
      );


    const table =
      document.getElementById(
        "barangTable"
      );


    if(table){

      table.innerHTML =
        html;

    }

  }catch(error){

    console.error(
      "Load barang:",
      error
    );

  }

}


/* =========================================================
   14. SAVE BARANG
========================================================= */

async function saveBarang(){

  if(isSavingBarang){

    return;

  }


  const kode =
    getValue(
      "barangKode"
    );

  const nama =
    getValue(
      "barangNama"
    );

  const kategori =
    getValue(
      "barangKategori"
    );

  const supplier =
    getValue(
      "barangSupplier"
    );

  const rak =
    getValue(
      "barangRak"
    );


  const stokValue =
    getValue(
      "barangStok"
    );

  const minimumValue =
    getValue(
      "barangMinimum"
    );


  const stok =
    Number(
      stokValue || 0
    );

  const minimum =
    Number(
      minimumValue || 0
    );


  if(!kode || !nama){

    showToast(
      "Kode dan Nama wajib diisi"
    );

    return;

  }


  if(
    !Number.isInteger(stok) ||
    stok < 0
  ){

    showToast(
      "Stok tidak valid"
    );

    return;

  }


  if(
    !Number.isInteger(minimum) ||
    minimum < 0
  ){

    showToast(
      "Stok minimum tidak valid"
    );

    return;

  }


  isSavingBarang = true;


  setButtonLoading(
    "btnSaveBarang",
    true
  );


  try{

    const payload = {

      kode,
      nama,
      kategori,
      supplier,
      rak,
      stok,
      stok_minimum:minimum

    };


    if(barangEditId){

      const {
        error
      } =
        await supabaseClient

        .from("barang")

        .update(
          payload
        )

        .eq(
          "id",
          barangEditId
        );


      if(error){

        throw error;

      }


      await saveActivity(
        `Edit barang ${nama}`
      );


      showToast(
        "Barang berhasil diperbarui"
      );


    }else{

      const {
        error
      } =
        await supabaseClient

        .from("barang")

        .insert([
          payload
        ]);


      if(error){

        throw error;

      }


      await saveActivity(
        `Tambah barang ${nama}`
      );


      showToast(
        "Barang berhasil ditambahkan"
      );

    }


    clearBarangForm();

    closeBarangModal();

    barangEditId =
      null;


    /*
      Reload hanya yang memang berubah.
    */

    await Promise.all([

      loadBarang(),

      loadDashboard(),

      loadSelectBarang(),

      loadSelectOpname()

    ]);


  }catch(error){

    console.error(
      "Save barang:",
      error
    );

    showToast(
      error.message ||
      "Gagal menyimpan barang"
    );

  }finally{

    isSavingBarang =
      false;

    setButtonLoading(
      "btnSaveBarang",
      false
    );

  }

}


/* =========================================================
   15. EDIT BARANG
========================================================= */

async function editBarang(id){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("barang")

      .select("*")

      .eq(
        "id",
        id
      )

      .single();


    if(error){

      throw error;

    }


    if(!data){

      showToast(
        "Barang tidak ditemukan"
      );

      return;

    }


    /*
      ID disimpan SEBELUM membuka modal.
    */

    barangEditId =
      id;


    setValue(
      "barangKode",
      data.kode
    );

    setValue(
      "barangNama",
      data.nama
    );

    setValue(
      "barangKategori",
      data.kategori || ""
    );

    setValue(
      "barangSupplier",
      data.supplier || ""
    );

    setValue(
      "barangRak",
      data.rak || ""
    );

    setValue(
      "barangStok",
      data.stok ?? 0
    );

    setValue(
      "barangMinimum",
      data.stok_minimum ?? 0
    );


    openBarangModal();


  }catch(error){

    console.error(
      "Edit barang:",
      error
    );

    showToast(
      error.message ||
      "Gagal mengambil data barang"
    );

  }

}


/* =========================================================
   16. DELETE BARANG
========================================================= */

async function hapusBarang(id){

  if(
    !confirm(
      "Yakin ingin menghapus barang ini?"
    )
  ){

    return;

  }


  try{

    const {
      data:barang
    } =
      await supabaseClient

      .from("barang")

      .select(
        "nama"
      )

      .eq(
        "id",
        id
      )

      .single();


    const {
      error
    } =
      await supabaseClient

      .from("barang")

      .delete()

      .eq(
        "id",
        id
      );


    if(error){

      throw error;

    }


    await saveActivity(
      `Hapus barang ${
        barang?.nama ||
        "ID " + id
      }`
    );


    showToast(
      "Barang berhasil dihapus"
    );


    await Promise.all([

      loadBarang(),

      loadDashboard(),

      loadSelectBarang(),

      loadSelectOpname()

    ]);


  }catch(error){

    console.error(
      "Delete barang:",
      error
    );

    showToast(
      error.message ||
      "Gagal menghapus barang"
    );

  }

}


/* =========================================================
   17. CLEAR BARANG FORM
========================================================= */

function clearBarangForm(){

  setValue(
    "barangKode",
    ""
  );

  setValue(
    "barangNama",
    ""
  );

  setValue(
    "barangKategori",
    ""
  );

  setValue(
    "barangSupplier",
    ""
  );

  setValue(
    "barangRak",
    ""
  );

  setValue(
    "barangStok",
    ""
  );

  setValue(
    "barangMinimum",
    "" 
  );

  barangEditId =
    null;

}


/* =========================================================
   18. SEARCH BARANG
========================================================= */

function searchBarang(){

  const keyword =
    getValue(
      "searchBarang"
    ).toLowerCase();


  document
    .querySelectorAll(
      "#barangTable tr"
    )
    .forEach(
      row=>{

        row.style.display =
          row.innerText
          .toLowerCase()
          .includes(keyword)
          ? ""
          : "none";

      }
    );

}


/* =========================================================
   19. LOAD SELECT BARANG
========================================================= */

async function loadSelectBarang(){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("barang")

      .select(
        "id,nama,stok"
      )

      .order(
        "nama",
        {
          ascending:true
        }
      );


    if(error){

      throw error;

    }


    let option =
      `<option value="">
        Pilih Barang
      </option>`;


    (data || [])
      .forEach(
        item=>{

          option += `

          <option value="${item.id}">

            ${escapeHTML(
              item.nama
            )}
            (${Number(
              item.stok || 0
            )})

          </option>

          `;

        }
      );


    const masuk =
      document.getElementById(
        "masukBarang"
      );

    const keluar =
      document.getElementById(
        "keluarBarang"
      );


    if(masuk){
      masuk.innerHTML =
        option;
    }

    if(keluar){
      keluar.innerHTML =
        option;
    }


  }catch(error){

    console.error(
      "Select barang:",
      error
    );

  }

}


/* =========================================================
   20. BARANG MASUK FORM
========================================================= */

function setupFormMasuk(){

  const form =
    document.getElementById(
      "formMasuk"
    );


  if(!form){
    return;
  }


  if(
    form.dataset.initialized ===
    "true"
  ){

    return;

  }


  form.dataset.initialized =
    "true";


  form.addEventListener(
    "submit",
    async event=>{

      event.preventDefault();


      const barangId =
        Number(
          getValue(
            "masukBarang"
          )
        );


      const qty =
        Number(
          getValue(
            "masukQty"
          )
        );


      const keterangan =
        getValue(
          "masukKeterangan"
        );


      if(
        !Number.isInteger(
          barangId
        ) ||
        barangId <= 0
      ){

        showToast(
          "Pilih barang"
        );

        return;

      }


      if(
        !Number.isInteger(qty) ||
        qty <= 0
      ){

        showToast(
          "Jumlah barang tidak valid"
        );

        return;

      }


      await simpanBarangMasuk(
        barangId,
        qty,
        keterangan
      );

    }
  );

}


/* =========================================================
   21. SIMPAN BARANG MASUK
========================================================= */

async function simpanBarangMasuk(
  barangId,
  qty,
  keterangan
){

  if(isSavingTransaksi){

    return;

  }


  isSavingTransaksi =
    true;


  try{

    const {
      data:barang,
      error:barangError
    } =
      await supabaseClient

      .from("barang")

      .select(
        "id,nama,stok"
      )

      .eq(
        "id",
        barangId
      )

      .single();


    if(barangError){

      throw barangError;

    }


    if(!barang){

      throw new Error(
        "Barang tidak ditemukan"
      );

    }


    const stokBaru =
      Number(
        barang.stok || 0
      ) +
      qty;


    const {
      error:insertError
    } =
      await supabaseClient

      .from("barang_masuk")

      .insert([{

        barang_id:
          barangId,

        qty,

        keterangan

      }]);


    if(insertError){

      throw insertError;

    }


    const {
      error:updateError
    } =
      await supabaseClient

      .from("barang")

      .update({

        stok:
          stokBaru

      })

      .eq(
        "id",
        barangId
      );


    if(updateError){

      throw updateError;

    }


    await saveActivity(
      `Barang masuk: ${barang.nama} (+${qty})`
    );


    showToast(
      "Barang masuk berhasil"
    );


    const form =
      document.getElementById(
        "formMasuk"
      );


    if(form){

      form.reset();

    }


    await Promise.all([

      loadBarang(),

      loadDashboard(),

      loadBarangMasuk(),

      loadSelectBarang(),

      loadSelectOpname()

    ]);


  }catch(error){

    console.error(
      "Barang masuk:",
      error
    );

    showToast(
      error.message ||
      "Barang masuk gagal"
    );

  }finally{

    isSavingTransaksi =
      false;

  }

}


/* =========================================================
   22. LOAD BARANG MASUK
========================================================= */

async function loadBarangMasuk(){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("barang_masuk")

      .select(`
        *,
        barang(
          nama
        )
      `)

      .order(
        "id",
        {
          ascending:false
        }
      );


    if(error){

      throw error;

    }


    let html = "";


    (data || [])
      .forEach(
        item=>{

          html += `

          <tr>

            <td>
              ${formatDate(
                item.created_at
              )}
            </td>

            <td>
              ${escapeHTML(
                item.barang?.nama ||
                "-"
              )}
            </td>

            <td>
              ${Number(
                item.qty || 0
              )}
            </td>

            <td>
              ${escapeHTML(
                item.keterangan ||
                "-"
              )}
            </td>

          </tr>

          `;

        }
      );


    const table =
      document.getElementById(
        "barangMasukTable"
      );


    if(table){

      table.innerHTML =
        html;

    }

  }catch(error){

    console.error(
      "Load barang masuk:",
      error
    );

  }

}


/* =========================================================
   23. BARANG KELUAR FORM
========================================================= */

function setupFormKeluar(){

  const form =
    document.getElementById(
      "formKeluar"
    );


  if(!form){
    return;
  }


  if(
    form.dataset.initialized ===
    "true"
  ){

    return;

  }


  form.dataset.initialized =
    "true";


  form.addEventListener(
    "submit",
    async event=>{

      event.preventDefault();


      const barangId =
        Number(
          getValue(
            "keluarBarang"
          )
        );


      const qty =
        Number(
          getValue(
            "keluarQty"
          )
        );


      const tujuan =
        getValue(
          "keluarTujuan"
        );


      if(
        !Number.isInteger(
          barangId
        ) ||
        barangId <= 0
      ){

        showToast(
          "Pilih barang"
        );

        return;

      }


      if(
        !Number.isInteger(qty) ||
        qty <= 0
      ){

        showToast(
          "Jumlah barang tidak valid"
        );

        return;

      }


      await simpanBarangKeluar(
        barangId,
        qty,
        tujuan
      );

    }
  );

}


/* =========================================================
   24. SIMPAN BARANG KELUAR
========================================================= */

async function simpanBarangKeluar(
  barangId,
  qty,
  tujuan
){

  if(isSavingTransaksi){

    return;

  }


  isSavingTransaksi =
    true;


  try{

    const {
      data:barang,
      error:barangError
    } =
      await supabaseClient

      .from("barang")

      .select(
        "id,nama,stok"
      )

      .eq(
        "id",
        barangId
      )

      .single();


    if(barangError){

      throw barangError;

    }


    if(!barang){

      throw new Error(
        "Barang tidak ditemukan"
      );

    }


    const stokSaatIni =
      Number(
        barang.stok || 0
      );


    if(
      stokSaatIni <
      qty
    ){

      showToast(
        `Stok tidak cukup. Stok tersedia: ${stokSaatIni}`
      );

      return;

    }


    const stokBaru =
      stokSaatIni -
      qty;


    const {
      error:insertError
    } =
      await supabaseClient

      .from("barang_keluar")

      .insert([{

        barang_id:
          barangId,

        qty,

        tujuan

      }]);


    if(insertError){

      throw insertError;

    }


    const {
      error:updateError
    } =
      await supabaseClient

      .from("barang")

      .update({

        stok:
          stokBaru

      })

      .eq(
        "id",
        barangId
      );


    if(updateError){

      throw updateError;

    }


    await saveActivity(
      `Barang keluar: ${barang.nama} (-${qty})`
    );


    showToast(
      "Barang keluar berhasil"
    );


    const form =
      document.getElementById(
        "formKeluar"
      );


    if(form){

      form.reset();

    }


    await Promise.all([

      loadBarang(),

      loadDashboard(),

      loadBarangKeluar(),

      loadSelectBarang(),

      loadSelectOpname()

    ]);


  }catch(error){

    console.error(
      "Barang keluar:",
      error
    );

    showToast(
      error.message ||
      "Barang keluar gagal"
    );

  }finally{

    isSavingTransaksi =
      false;

  }

}


/* =========================================================
   25. LOAD BARANG KELUAR
========================================================= */

async function loadBarangKeluar(){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("barang_keluar")

      .select(`
        *,
        barang(
          nama
        )
      `)

      .order(
        "id",
        {
          ascending:false
        }
      );


    if(error){

      throw error;

    }


    let html = "";


    (data || [])
      .forEach(
        item=>{

          html += `

          <tr>

            <td>
              ${formatDate(
                item.created_at
              )}
            </td>

            <td>
              ${escapeHTML(
                item.barang?.nama ||
                "-"
              )}
            </td>

            <td>
              ${Number(
                item.qty || 0
              )}
            </td>

            <td>
              ${escapeHTML(
                item.tujuan ||
                "-"
              )}
            </td>

          </tr>

          `;

        }
      );


    const table =
      document.getElementById(
        "barangKeluarTable"
      );


    if(table){

      table.innerHTML =
        html;

    }

  }catch(error){

    console.error(
      "Load barang keluar:",
      error
    );

  }

}


/* =========================================================
   26. SUPPLIER MODAL
========================================================= */

function openSupplierModal(){

  const modal =
    document.getElementById(
      "supplierModal"
    );

  if(modal){

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeSupplierModal(){

  const modal =
    document.getElementById(
      "supplierModal"
    );

  if(modal){

    modal.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   27. LOAD SUPPLIER
========================================================= */

async function loadSupplier(){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("supplier")

      .select("*")

      .order(
        "id",
        {
          ascending:false
        }
      );


    if(error){

      throw error;

    }


    let html = "";


    (data || [])
      .forEach(
        item=>{

          html += `

          <tr>

            <td>
              ${escapeHTML(
                item.nama ||
                "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                item.telepon ||
                "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                item.email ||
                "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                item.alamat ||
                "-"
              )}
            </td>

            <td>

              <button
              type="button"
              onclick="editSupplier(${item.id})">

                Edit

              </button>

              <button
              type="button"
              onclick="hapusSupplier(${item.id})">

                Hapus

              </button>

            </td>

          </tr>

          `;

        }
      );


    const table =
      document.getElementById(
        "supplierTable"
      );


    if(table){

      table.innerHTML =
        html;

    }

  }catch(error){

    console.error(
      "Load supplier:",
      error
    );

  }

}


/* =========================================================
   28. SAVE SUPPLIER
========================================================= */

async function saveSupplier(){

  if(isSavingSupplier){

    return;

  }


  const nama =
    getValue(
      "supplierNama"
    );

  const telepon =
    getValue(
      "supplierTelepon"
    );

  const email =
    getValue(
      "supplierEmail"
    );

  const alamat =
    getValue(
      "supplierAlamat"
    );


  if(!nama){

    showToast(
      "Nama supplier wajib diisi"
    );

    return;

  }


  isSavingSupplier =
    true;


  setButtonLoading(
    "btnSaveSupplier",
    true
  );


  try{

    const payload = {

      nama,
      telepon,
      email,
      alamat

    };


    if(supplierEditId){

      const {
        error
      } =
        await supabaseClient

        .from("supplier")

        .update(
          payload
        )

        .eq(
          "id",
          supplierEditId
        );


      if(error){

        throw error;

      }


      await saveActivity(
        `Edit supplier ${nama}`
      );


      showToast(
        "Supplier berhasil diperbarui"
      );


    }else{

      const {
        error
      } =
        await supabaseClient

        .from("supplier")

        .insert([
          payload
        ]);


      if(error){

        throw error;

      }


      await saveActivity(
        `Tambah supplier ${nama}`
      );


      showToast(
        "Supplier berhasil ditambahkan"
      );

    }


    clearSupplierForm();

    closeSupplierModal();

    await loadSupplier();


  }catch(error){

    console.error(
      "Save supplier:",
      error
    );

    showToast(
      error.message ||
      "Gagal menyimpan supplier"
    );

  }finally{

    isSavingSupplier =
      false;

    setButtonLoading(
      "btnSaveSupplier",
      false
    );

  }

}


/* =========================================================
   29. EDIT SUPPLIER
========================================================= */

async function editSupplier(id){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("supplier")

      .select("*")

      .eq(
        "id",
        id
      )

      .single();


    if(error){

      throw error;

    }


    supplierEditId =
      id;


    setValue(
      "supplierNama",
      data.nama || ""
    );

    setValue(
      "supplierTelepon",
      data.telepon || ""
    );

    setValue(
      "supplierEmail",
      data.email || ""
    );

    setValue(
      "supplierAlamat",
      data.alamat || ""
    );


    openSupplierModal();


  }catch(error){

    console.error(
      "Edit supplier:",
      error
    );

    showToast(
      error.message ||
      "Gagal mengambil supplier"
    );

  }

}


/* =========================================================
   30. DELETE SUPPLIER
========================================================= */

async function hapusSupplier(id){

  if(
    !confirm(
      "Yakin ingin menghapus supplier ini?"
    )
  ){

    return;

  }


  try{

    const {
      data:supplier
    } =
      await supabaseClient

      .from("supplier")

      .select(
        "nama"
      )

      .eq(
        "id",
        id
      )

      .single();


    const {
      error
    } =
      await supabaseClient

      .from("supplier")

      .delete()

      .eq(
        "id",
        id
      );


    if(error){

      throw error;

    }


    await saveActivity(
      `Hapus supplier ${
        supplier?.nama ||
        "ID " + id
      }`
    );


    showToast(
      "Supplier berhasil dihapus"
    );


    await loadSupplier();


  }catch(error){

    console.error(
      "Delete supplier:",
      error
    );

    showToast(
      error.message ||
      "Gagal menghapus supplier"
    );

  }

}


/* =========================================================
   31. CLEAR SUPPLIER
========================================================= */

function clearSupplierForm(){

  setValue(
    "supplierNama",
    ""
  );

  setValue(
    "supplierTelepon",
    ""
  );

  setValue(
    "supplierEmail",
    ""
  );

  setValue(
    "supplierAlamat",
    ""
  );

  supplierEditId =
    null;

}


/* =========================================================
   32. SEARCH SUPPLIER
========================================================= */

function searchSupplier(){

  const keyword =
    getValue(
      "searchSupplier"
    ).toLowerCase();


  document
    .querySelectorAll(
      "#supplierTable tr"
    )
    .forEach(
      row=>{

        row.style.display =
          row.innerText
          .toLowerCase()
          .includes(keyword)
          ? ""
          : "none";

      }
    );

}


/* =========================================================
   33. ACTIVITY LOG
========================================================= */

async function saveActivity(
  aktivitas
){

  try{

    const {
      data
    } =
      await supabaseClient
      .auth
      .getUser();


    const email =
      data?.user?.email ||
      "admin";


    const {
      error
    } =
      await supabaseClient

      .from("activity_logs")

      .insert([{

        aktivitas,

        user_email:
          email

      }]);


    if(error){

      /*
        Log gagal tidak boleh
        menggagalkan transaksi utama.
      */

      console.error(
        "Activity log error:",
        error
      );

    }

  }catch(error){

    console.error(
      "Activity log:",
      error
    );

  }

}


async function loadActivity(){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("activity_logs")

      .select("*")

      .order(
        "id",
        {
          ascending:false
        }
      )

      .limit(100);


    if(error){

      throw error;

    }


    let html = "";


    (data || [])
      .forEach(
        item=>{

          html += `

          <tr>

            <td>
              ${escapeHTML(
                formatDate(
                  item.created_at
                )
              )}
            </td>

            <td>
              ${escapeHTML(
                item.user_email ||
                "admin"
              )}
            </td>

            <td>
              ${escapeHTML(
                item.aktivitas ||
                "-"
              )}
            </td>

          </tr>

          `;

        }
      );


    const table =
      document.getElementById(
        "activityTable"
      );


    if(table){

      table.innerHTML =
        html;

    }

  }catch(error){

    console.error(
      "Load activity:",
      error
    );

  }

}


function searchActivity(){

  const keyword =
    getValue(
      "searchActivity"
    ).toLowerCase();


  document
    .querySelectorAll(
      "#activityTable tr"
    )
    .forEach(
      row=>{

        row.style.display =
          row.innerText
          .toLowerCase()
          .includes(keyword)
          ? ""
          : "none";

      }
    );

}


/* =========================================================
   34. STOCK OPNAME SELECT
========================================================= */

async function loadSelectOpname(){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("barang")

      .select(
        "id,nama,stok"
      )

      .order(
        "nama",
        {
          ascending:true
        }
      );


    if(error){

      throw error;

    }


    let html =
      `<option value="">
        Pilih Barang
      </option>`;


    (data || [])
      .forEach(
        item=>{

          html += `

          <option value="${item.id}">

            ${escapeHTML(
              item.nama
            )}
            (Stok: ${Number(
              item.stok || 0
            )})

          </option>

          `;

        }
      );


    const select =
      document.getElementById(
        "opnameBarang"
      );


    if(select){

      select.innerHTML =
        html;

    }

  }catch(error){

    console.error(
      "Select opname:",
      error
    );

  }

}


/* =========================================================
   35. LOAD STOCK OPNAME
========================================================= */

async function loadStockOpname(){

  try{

    const {
      data,
      error
    } =
      await supabaseClient

      .from("stock_opname")

      .select(`
        *,
        barang(
          nama
        )
      `)

      .order(
        "id",
        {
          ascending:false
        }
      );


    if(error){

      throw error;

    }


    let html = "";


    (data || [])
      .forEach(
        item=>{

          html += `

          <tr>

            <td>
              ${escapeHTML(
                formatDate(
                  item.created_at
                )
              )}
            </td>

            <td>
              ${escapeHTML(
                item.barang?.nama ||
                "-"
              )}
            </td>

            <td>
              ${Number(
                item.stok_sistem || 0
              )}
            </td>

            <td>
              ${Number(
                item.stok_fisik || 0
              )}
            </td>

            <td>
              ${Number(
                item.selisih || 0
              )}
            </td>

            <td>
              ${escapeHTML(
                item.keterangan ||
                "-"
              )}
            </td>

          </tr>

          `;

        }
      );


    const table =
      document.getElementById(
        "stockOpnameTable"
      );


    if(table){

      table.innerHTML =
        html;

    }

  }catch(error){

    console.error(
      "Load stock opname:",
      error
    );

  }

}


/* =========================================================
   36. STOCK OPNAME SUBMIT
========================================================= */

async function submitStockOpname(){

  if(isSavingOpname){

    return;

  }


  const barangId =
    Number(
      getValue(
        "opnameBarang"
      )
    );


  const stokFisik =
    Number(
      getValue(
        "opnameStok"
      )
    );


  const keterangan =
    getValue(
      "opnameKeterangan"
    );


  if(
    !Number.isInteger(
      barangId
    ) ||
    barangId <= 0
  ){

    showToast(
      "Pilih barang terlebih dahulu"
    );

    return;

  }


  if(
    !Number.isInteger(
      stokFisik
    ) ||
    stokFisik < 0
  ){

    showToast(
      "Stok fisik tidak valid"
    );

    return;

  }


  isSavingOpname =
    true;


  try{

    const {
      data:barang,
      error:barangError
    } =
      await supabaseClient

      .from("barang")

      .select(
        "id,nama,stok"
      )

      .eq(
        "id",
        barangId
      )

      .single();


    if(barangError){

      throw barangError;

    }


    if(!barang){

      throw new Error(
        "Barang tidak ditemukan"
      );

    }


    const stokSistem =
      Number(
        barang.stok || 0
      );


    const selisih =
      stokFisik -
      stokSistem;


    const {
      error:opnameError
    } =
      await supabaseClient

      .from("stock_opname")

      .insert([{

        barang_id:
          barangId,

        stok_sistem:
          stokSistem,

        stok_fisik:
          stokFisik,

        selisih,

        keterangan

      }]);


    if(opnameError){

      throw opnameError;

    }


    const {
      error:updateError
    } =
      await supabaseClient

      .from("barang")

      .update({

        stok:
          stokFisik

      })

      .eq(
        "id",
        barangId
      );


    if(updateError){

      throw updateError;

    }


    await saveActivity(
      `Stock opname: ${barang.nama} ${stokSistem} → ${stokFisik} (selisih ${selisih})`
    );


    showToast(
      "Stock opname berhasil"
    );


    const form =
      document.getElementById(
        "formOpname"
      );


    if(form){

      form.reset();

    }


    await Promise.all([

      loadStockOpname(),

      loadBarang(),

      loadDashboard(),

      loadSelectBarang(),

      loadSelectOpname()

    ]);


  }catch(error){

    console.error(
      "Stock opname:",
      error
    );

    showToast(
      error.message ||
      "Stock opname gagal"
    );

  }finally{

    isSavingOpname =
      false;

  }

}


/* =========================================================
   37. EXPORT EXCEL
========================================================= */

async function exportExcel(){

  if(
    typeof XLSX ===
    "undefined"
  ){

    showToast(
      "Library Excel belum dipasang"
    );

    return;

  }


  try{

    showToast(
      "Menyiapkan Excel..."
    );


    const [

      barangResult,

      masukResult,

      keluarResult,

      supplierResult

    ] =
      await Promise.all([

        supabaseClient
          .from("barang")
          .select("*")
          .order("id"),

        supabaseClient
          .from("barang_masuk")
          .select(`
            *,
            barang(nama)
          `)
          .order("id"),

        supabaseClient
          .from("barang_keluar")
          .select(`
            *,
            barang(nama)
          `)
          .order("id"),

        supabaseClient
          .from("supplier")
          .select("*")
          .order("id")

      ]);


    if(barangResult.error)
      throw barangResult.error;

    if(masukResult.error)
      throw masukResult.error;

    if(keluarResult.error)
      throw keluarResult.error;

    if(supplierResult.error)
      throw supplierResult.error;


    const barang =
      (barangResult.data || [])
      .map(
        item=>({

          Kode:
            item.kode,

          Nama:
            item.nama,

          Kategori:
            item.kategori || "",

          Supplier:
            item.supplier || "",

          Rak:
            item.rak || "",

          Stok:
            Number(
              item.stok || 0
            ),

          "Stok Minimum":
            Number(
              item.stok_minimum || 0
            )

        })
      );


    const masuk =
      (masukResult.data || [])
      .map(
        item=>({

          Tanggal:
            formatDate(
              item.created_at
            ),

          Barang:
            item.barang?.nama ||
            "",

          Qty:
            Number(
              item.qty || 0
            ),

          Keterangan:
            item.keterangan ||
            ""

        })
      );


    const keluar =
      (keluarResult.data || [])
      .map(
        item=>({

          Tanggal:
            formatDate(
              item.created_at
            ),

          Barang:
            item.barang?.nama ||
            "",

          Qty:
            Number(
              item.qty || 0
            ),

          Tujuan:
            item.tujuan ||
            ""

        })
      );


    const supplier =
      (supplierResult.data || [])
      .map(
        item=>({

          Nama:
            item.nama ||
            "",

          Telepon:
            item.telepon ||
            "",

          Email:
            item.email ||
            "",

          Alamat:
            item.alamat ||
            ""

        })
      );


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,

      XLSX.utils.json_to_sheet(
        barang
      ),

      "Stok Barang"
    );


    XLSX.utils.book_append_sheet(
      workbook,

      XLSX.utils.json_to_sheet(
        masuk
      ),

      "Barang Masuk"
    );


    XLSX.utils.book_append_sheet(
      workbook,

      XLSX.utils.json_to_sheet(
        keluar
      ),

      "Barang Keluar"
    );


    XLSX.utils.book_append_sheet(
      workbook,

      XLSX.utils.json_to_sheet(
        supplier
      ),

      "Supplier"
    );


    XLSX.writeFile(
      workbook,

      `INVENTRA_PRO_${getTodayString()}.xlsx`
    );


    await saveActivity(
      "Export data ke Excel"
    );


    showToast(
      "Excel berhasil dibuat"
    );


  }catch(error){

    console.error(
      "Export Excel:",
      error
    );

    showToast(
      error.message ||
      "Export Excel gagal"
    );

  }

}


/* =========================================================
   38. REFRESH ALL
========================================================= */

async function refreshAllData(){

  try{

    await Promise.allSettled([

      loadDashboard(),

      loadBarang(),

      loadSupplier(),

      loadBarangMasuk(),

      loadBarangKeluar(),

      loadActivity(),

      loadSelectBarang(),

      loadSelectOpname(),

      loadStockOpname()

    ]);

  }catch(error){

    console.error(
      "Refresh all:",
      error
    );

  }

}


/* =========================================================
   39. AUTO REFRESH
========================================================= */

function startAutoRefresh(){

  stopAutoRefresh();


  /*
    Dashboard diperbarui setiap 30 detik.
    Tidak reload seluruh tabel supaya ringan.
  */

  autoRefreshTimer =
    setInterval(
      async()=>{

        try{

          const {
            data
          } =
            await supabaseClient
            .auth
            .getSession();


          if(
            data?.session
          ){

            await loadDashboard();

          }

        }catch(error){

          console.error(
            "Auto refresh:",
            error
          );

        }

      },
      30000
    );

}


function stopAutoRefresh(){

  if(autoRefreshTimer){

    clearInterval(
      autoRefreshTimer
    );

    autoRefreshTimer =
      null;

  }

}


/* =========================================================
   40. TAB VISIBILITY
========================================================= */

document.addEventListener(
  "visibilitychange",
  async()=>{

    if(
      document.visibilityState !==
      "visible"
    ){

      return;

    }


    try{

      const {
        data
      } =
        await supabaseClient
        .auth
        .getSession();


      if(
        data?.session
      ){

        await loadDashboard();

      }

    }catch(error){

      console.error(
        "Visibility refresh:",
        error
      );

    }

  }
);


/* =========================================================
   41. ONLINE / OFFLINE
========================================================= */

window.addEventListener(
  "online",
  ()=>{

    showToast(
      "Koneksi internet kembali"
    );

    loadDashboard();

  }
);


window.addEventListener(
  "offline",
  ()=>{

    showToast(
      "Koneksi internet terputus"
    );

  }
);


/* =========================================================
   42. ESCAPE CLOSE MODAL
========================================================= */

document.addEventListener(
  "keydown",
  event=>{

    if(
      event.key !==
      "Escape"
    ){

      return;

    }


    document
      .querySelectorAll(
        ".modal"
      )
      .forEach(
        modal=>{

          modal.classList.add(
            "hidden"
          );

        }
      );

  }
);


/* =========================================================
   43. FORM INITIALIZATION
========================================================= */

function initializeForms(){

  setupFormMasuk();

  setupFormKeluar();

}


/* =========================================================
   44. SUPABASE AUTH STATE
========================================================= */

supabaseClient
  .auth
  .onAuthStateChange(
    (event,session)=>{

      if(
        event ===
        "SIGNED_OUT"
      ){

        stopAutoRefresh();

        return;

      }


      if(
        session &&
        !appInitialized
      ){

        showApplication();

      }

    }
  );


/* =========================================================
   45. GLOBAL FUNCTIONS
   Untuk onclick HTML
========================================================= */

window.loginAdmin =
  loginAdmin;

window.logoutAdmin =
  logoutAdmin;

window.showPage =
  showPage;

window.openBarangModal =
  openBarangModal;

window.closeBarangModal =
  closeBarangModal;

window.saveBarang =
  saveBarang;

window.editBarang =
  editBarang;

window.hapusBarang =
  hapusBarang;

window.clearBarangForm =
  clearBarangForm;

window.searchBarang =
  searchBarang;

window.simpanBarangMasuk =
  simpanBarangMasuk;

window.simpanBarangKeluar =
  simpanBarangKeluar;

window.openSupplierModal =
  openSupplierModal;

window.closeSupplierModal =
  closeSupplierModal;

window.saveSupplier =
  saveSupplier;

window.editSupplier =
  editSupplier;

window.hapusSupplier =
  hapusSupplier;

window.clearSupplierForm =
  clearSupplierForm;

window.searchSupplier =
  searchSupplier;

window.searchActivity =
  searchActivity;

window.exportExcel =
  exportExcel;

window.loadStockOpname =
  loadStockOpname;

window.submitStockOpname =
  submitStockOpname;

window.loadSelectOpname =
  loadSelectOpname;

window.refreshAllData =
  refreshAllData;


/* =========================================================
   46. START APPLICATION
========================================================= */

initializeForms();

checkSession();


/* =========================================================
   INVENTRA PRO v1.0
   READY
========================================================= */

console.log(
  "INVENTRA PRO v1.0 - Production loaded."
);
