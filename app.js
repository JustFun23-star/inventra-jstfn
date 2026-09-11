```javascript
/* =========================================================
   INVENTRA PRO
   Developer : Ju5t Fun
   File      : app.js
   Version   : Production v1.0
   Compatible dengan HTML Inventra Pro yang Anda kirim
========================================================= */


/* =========================================================
   1. SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
  "YOUR_SUPABASE_URL";

const SUPABASE_KEY =
  "YOUR_SUPABASE_ANON_KEY";


/* =========================================================
   CEK LIBRARY SUPABASE
========================================================= */

if (
  typeof supabase === "undefined"
) {
  console.error(
    "Supabase library belum dimuat."
  );
}


/* =========================================================
   SUPABASE CLIENT
========================================================= */

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

let appInitialized = false;

let isSavingBarang = false;

let isSavingSupplier = false;

let isSavingTransaksi = false;

let isSavingOpname = false;

let toastTimer = null;


/* =========================================================
   3. UTILITY
========================================================= */

function getElement(id) {

  return document.getElementById(id);

}


function getValue(id) {

  const element =
    getElement(id);

  if (!element) {
    return "";
  }

  return String(
    element.value ?? ""
  ).trim();

}


function setValue(
  id,
  value
) {

  const element =
    getElement(id);

  if (element) {
    element.value =
      value ?? "";
  }

}


function setText(
  id,
  value
) {

  const element =
    getElement(id);

  if (element) {
    element.innerText =
      value ?? "";
  }

}


function escapeHTML(value) {

  return String(
    value ?? ""
  )
  .replace(
    /&/g,
    "&amp;"
  )
  .replace(
    /</g,
    "&lt;"
  )
  .replace(
    />/g,
    "&gt;"
  )
  .replace(
    /"/g,
    "&quot;"
  )
  .replace(
    /'/g,
    "&#039;"
  );

}


function formatDate(value) {

  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


function getTodayString() {

  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}


function numberValue(
  value,
  fallback = 0
) {

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return fallback;
  }

  return number;

}


/* =========================================================
   4. TOAST
========================================================= */

function showToast(message) {

  const toast =
    getElement("toast");

  if (!toast) {

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
      () => {

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

function hideLoadingScreen() {

  const loading =
    getElement(
      "loadingScreen"
    );

  if (!loading) {
    return;
  }

  loading.style.display =
    "none";

}


/* =========================================================
   6. LOGIN
========================================================= */

async function loginAdmin() {

  const email =
    getValue(
      "loginEmail"
    );

  const passwordElement =
    getElement(
      "loginPassword"
    );

  const password =
    passwordElement
      ? passwordElement.value
      : "";


  if (
    !email ||
    !password
  ) {

    setText(
      "loginStatus",
      "Email dan password wajib diisi"
    );

    return;

  }


  const button =
    document.querySelector(
      "#loginPage button"
    );


  if (button) {

    button.disabled =
      true;

    button.innerText =
      "Memproses...";

  }


  try {

    const {
      error
    } =
      await supabaseClient
      .auth
      .signInWithPassword({

        email,
        password

      });


    if (error) {

      setText(
        "loginStatus",
        error.message
      );

      return;

    }


    setText(
      "loginStatus",
      ""
    );


    await showApplication();


  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    setText(
      "loginStatus",
      "Login gagal. Silakan coba lagi."
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.innerText =
        "Login";

    }

  }

}


/* =========================================================
   7. LOGOUT
========================================================= */

async function logoutAdmin() {

  stopAutoRefresh();

  try {

    await supabaseClient
      .auth
      .signOut();

  } catch (error) {

    console.error(
      "Logout:",
      error
    );

  }

  location.reload();

}


/* =========================================================
   8. SESSION
========================================================= */

async function checkSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
      .auth
      .getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      return;

    }


    if (
      data &&
      data.session
    ) {

      await showApplication();

    }

  } catch (error) {

    console.error(
      "Check session:",
      error
    );

  }

}


/* =========================================================
   9. SHOW APPLICATION
========================================================= */

async function showApplication() {

  const loginPage =
    getElement(
      "loginPage"
    );

  const app =
    getElement(
      "app"
    );


  if (loginPage) {

    loginPage.classList.add(
      "hidden"
    );

  }


  if (app) {

    app.classList.remove(
      "hidden"
    );

  }


  await initApp();

}


/* =========================================================
   10. SPA NAVIGATION
========================================================= */

function showPage(pageId) {

  document
    .querySelectorAll(
      ".page"
    )
    .forEach(
      page => {

        page.classList.add(
          "hidden"
        );

      }
    );


  const target =
    getElement(pageId);


  if (target) {

    target.classList.remove(
      "hidden"
    );

  }


  updatePageTitle(
    pageId
  );

}


function updatePageTitle(
  pageId
) {

  const titles = {

    dashboardPage:
      "Dashboard",

    barangPage:
      "Data Barang",

    barangMasukPage:
      "Barang Masuk",

    barangKeluarPage:
      "Barang Keluar",

    supplierPage:
      "Supplier",

    spreadsheetPage:
      "Spreadsheet",

    stockPage:
      "Stock Opname",

    activityPage:
      "Activity Log",

    settingPage:
      "Pengaturan"

  };


  setText(
    "pageTitle",
    titles[pageId] ||
    "Inventra Pro"
  );

}


/* =========================================================
   11. INITIALIZE APPLICATION
========================================================= */

async function initApp() {

  if (appInitialized) {

    await loadDashboard();

    return;

  }


  appInitialized =
    true;


  try {

    /*
      Form Stock Opname dibuat
      otomatis karena HTML asli
      belum memiliki form-nya.
    */

    createStockOpnameForm();


    /*
      Load data secara paralel
      supaya lebih cepat.
    */

    await Promise.allSettled([

      loadDashboard(),

      loadBarang(),

      loadBarangMasuk(),

      loadBarangKeluar(),

      loadSupplier(),

      loadActivity(),

      loadSelectBarang(),

      loadSelectOpname(),

      loadStockOpname()

    ]);


    startAutoRefresh();


  } catch (error) {

    console.error(
      "Init application:",
      error
    );

  }

}


/* =========================================================
   12. DASHBOARD
========================================================= */

async function loadDashboard() {

  try {

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


    if (barangResult.error) {
      throw barangResult.error;
    }

    if (masukResult.error) {
      throw masukResult.error;
    }

    if (keluarResult.error) {
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
        (
          total,
          item
        ) => {

          return (
            total +
            numberValue(
              item.stok
            )
          );

        },
        0
      );


    const stokMenipis =
      barang.filter(
        item => {

          const stok =
            numberValue(
              item.stok
            );

          const minimum =
            numberValue(
              item.stok_minimum
            );

          return (
            stok <=
            minimum
          );

        }
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
      .slice(0, 10)
      .forEach(
        item => {

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
                  item.kategori ||
                  "-"
                )}
              </td>

              <td>
                ${numberValue(
                  item.stok
                )}
              </td>

            </tr>

          `;

        }
      );


    const table =
      getElement(
        "dashboardBarang"
      );


    if (table) {

      table.innerHTML =
        html;

    }

  } catch (error) {

    console.error(
      "Dashboard:",
      error
    );

  }

}


/* =========================================================
   13. BARANG MODAL
========================================================= */

function openBarangModal() {

  const modal =
    getElement(
      "barangModal"
    );


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeBarangModal() {

  const modal =
    getElement(
      "barangModal"
    );


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   14. LOAD BARANG
========================================================= */

async function loadBarang() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
      .from("barang")
      .select("*")
      .order(
        "id",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    let html = "";


    (
      data || []
    ).forEach(
      item => {

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
                item.kategori ||
                "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                item.supplier ||
                "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                item.rak ||
                "-"
              )}
            </td>

            <td>
              ${numberValue(
                item.stok
              )}
            </td>

            <td>
              ${numberValue(
                item.stok_minimum
              )}
            </td>

            <td>

              <button
                type="button"
                onclick="editBarang(${item.id})"
              >
                Edit
              </button>

              <button
                type="button"
                onclick="hapusBarang(${item.id})"
              >
                Hapus
              </button>

            </td>

          </tr>

        `;

      }
    );


    const table =
      getElement(
        "barangTable"
      );


    if (table) {

      table.innerHTML =
        html;

    }

  } catch (error) {

    console.error(
      "Load barang:",
      error
    );

  }

}


/* =========================================================
   15. SAVE BARANG
========================================================= */

async function saveBarang() {

  if (isSavingBarang) {
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

  const stok =
    Number(
      getValue(
        "barangStok"
      ) || 0
    );

  const minimum =
    Number(
      getValue(
        "barangMinimum"
      ) || 0
    );


  if (!kode || !nama) {

    showToast(
      "Kode dan Nama wajib diisi"
    );

    return;

  }


  if (
    !Number.isInteger(stok) ||
    stok < 0
  ) {

    showToast(
      "Stok tidak valid"
    );

    return;

  }


  if (
    !Number.isInteger(
      minimum
    ) ||
    minimum < 0
  ) {

    showToast(
      "Stok minimum tidak valid"
    );

    return;

  }


  isSavingBarang =
    true;


  try {

    const payload = {

      kode,

      nama,

      kategori,

      supplier,

      rak,

      stok,

      stok_minimum:
        minimum

    };


    if (barangEditId) {

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


      if (error) {
        throw error;
      }


      await saveActivity(
        `Edit barang ${nama}`
      );


      showToast(
        "Barang berhasil diperbarui"
      );


    } else {

      const {
        error
      } =
        await supabaseClient
        .from("barang")
        .insert([
          payload
        ]);


      if (error) {
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


    await Promise.all([

      loadBarang(),

      loadDashboard(),

      loadSelectBarang(),

      loadSelectOpname()

    ]);


  } catch (error) {

    console.error(
      "Save barang:",
      error
    );

    showToast(
      error.message ||
      "Gagal menyimpan barang"
    );

  } finally {

    isSavingBarang =
      false;

  }

}


/* =========================================================
   16. EDIT BARANG
========================================================= */

async function editBarang(id) {

  try {

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


    if (error) {
      throw error;
    }


    if (!data) {

      showToast(
        "Barang tidak ditemukan"
      );

      return;

    }


    /*
      PENTING:
      ID disimpan sebelum modal dibuka.
      openBarangModal tidak mereset ID.
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
      data.kategori ||
      ""
    );

    setValue(
      "barangSupplier",
      data.supplier ||
      ""
    );

    setValue(
      "barangRak",
      data.rak ||
      ""
    );

    setValue(
      "barangStok",
      data.stok ??
      0
    );

    setValue(
      "barangMinimum",
      data.stok_minimum ??
      0
    );


    openBarangModal();


  } catch (error) {

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
   17. DELETE BARANG
========================================================= */

async function hapusBarang(id) {

  if (
    !confirm(
      "Yakin ingin menghapus barang ini?"
    )
  ) {

    return;

  }


  try {

    const {
      data: barang
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


    if (error) {
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


  } catch (error) {

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
   18. CLEAR BARANG
========================================================= */

function clearBarangForm() {

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
   19. SEARCH BARANG
========================================================= */

function searchBarang() {

  const keyword =
    getValue(
      "searchBarang"
    )
    .toLowerCase();


  document
    .querySelectorAll(
      "#barangTable tr"
    )
    .forEach(
      row => {

        const text =
          row.innerText
          .toLowerCase();


        row.style.display =
          text.includes(
            keyword
          )
          ? ""
          : "none";

      }
    );

}


/* =========================================================
   20. LOAD SELECT BARANG
========================================================= */

async function loadSelectBarang() {

  try {

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
          ascending: true
        }
      );


    if (error) {
      throw error;
    }


    let options =
      `
      <option value="">
        Pilih Barang
      </option>
      `;


    (
      data || []
    ).forEach(
      item => {

        options += `

          <option
            value="${item.id}"
          >
            ${escapeHTML(
              item.nama
            )}
            (${numberValue(
              item.stok
            )})
          </option>

        `;

      }
    );


    const masuk =
      getElement(
        "masukBarang"
      );

    const keluar =
      getElement(
        "keluarBarang"
      );


    if (masuk) {

      masuk.innerHTML =
        options;

    }


    if (keluar) {

      keluar.innerHTML =
        options;

    }


  } catch (error) {

    console.error(
      "Load select barang:",
      error
    );

  }

}


/* =========================================================
   21. BARANG MASUK FORM
========================================================= */

function setupFormMasuk() {

  const form =
    getElement(
      "formMasuk"
    );


  if (!form) {
    return;
  }


  if (
    form.dataset.initialized ===
    "true"
  ) {

    return;

  }


  form.dataset.initialized =
    "true";


  form.addEventListener(
    "submit",
    async event => {

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


      if (
        !Number.isInteger(
          barangId
        ) ||
        barangId <= 0
      ) {

        showToast(
          "Pilih barang"
        );

        return;

      }


      if (
        !Number.isInteger(qty) ||
        qty <= 0
      ) {

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
   22. SIMPAN BARANG MASUK
========================================================= */

async function simpanBarangMasuk(
  barangId,
  qty,
  keterangan
) {

  if (isSavingTransaksi) {
    return;
  }


  isSavingTransaksi =
    true;


  try {

    const {
      data: barang,
      error: barangError
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


    if (barangError) {
      throw barangError;
    }


    if (!barang) {

      throw new Error(
        "Barang tidak ditemukan"
      );

    }


    const stokSaatIni =
      numberValue(
        barang.stok
      );


    const stokBaru =
      stokSaatIni +
      qty;


    const {
      error: insertError
    } =
      await supabaseClient
      .from("barang_masuk")
      .insert([{

        barang_id:
          barangId,

        qty:

          qty,

        keterangan:
          keterangan

      }]);


    if (insertError) {
      throw insertError;
    }


    const {
      error: updateError
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


    if (updateError) {
      throw updateError;
    }


    await saveActivity(
      `Barang masuk: ${barang.nama} (+${qty})`
    );


    showToast(
      "Barang masuk berhasil"
    );


    const form =
      getElement(
        "formMasuk"
      );


    if (form) {
      form.reset();
    }


    await Promise.all([

      loadBarang(),

      loadDashboard(),

      loadBarangMasuk(),

      loadSelectBarang(),

      loadSelectOpname()

    ]);


  } catch (error) {

    console.error(
      "Barang masuk:",
      error
    );

    showToast(
      error.message ||
      "Barang masuk gagal"
    );

  } finally {

    isSavingTransaksi =
      false;

  }

}


/* =========================================================
   23. LOAD BARANG MASUK
========================================================= */

async function loadBarangMasuk() {

  try {

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
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    let html = "";


    (
      data || []
    ).forEach(
      item => {

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
              ${numberValue(
                item.qty
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
      getElement(
        "barangMasukTable"
      );


    if (table) {

      table.innerHTML =
        html;

    }

  } catch (error) {

    console.error(
      "Load barang masuk:",
      error
    );

  }

}


/* =========================================================
   24. BARANG KELUAR FORM
========================================================= */

function setupFormKeluar() {

  const form =
    getElement(
      "formKeluar"
    );


  if (!form) {
    return;
  }


  if (
    form.dataset.initialized ===
    "true"
  ) {

    return;

  }


  form.dataset.initialized =
    "true";


  form.addEventListener(
    "submit",
    async event => {

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


      if (
        !Number.isInteger(
          barangId
        ) ||
        barangId <= 0
      ) {

        showToast(
          "Pilih barang"
        );

        return;

      }


      if (
        !Number.isInteger(qty) ||
        qty <= 0
      ) {

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
   25. SIMPAN BARANG KELUAR
========================================================= */

async function simpanBarangKeluar(
  barangId,
  qty,
  tujuan
) {

  if (isSavingTransaksi) {
    return;
  }


  isSavingTransaksi =
    true;


  try {

    const {
      data: barang,
      error: barangError
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


    if (barangError) {
      throw barangError;
    }


    if (!barang) {

      throw new Error(
        "Barang tidak ditemukan"
      );

    }


    const stokSaatIni =
      numberValue(
        barang.stok
      );


    if (
      stokSaatIni <
      qty
    ) {

      showToast(
        `Stok tidak cukup. Tersedia: ${stokSaatIni}`
      );

      return;

    }


    const stokBaru =
      stokSaatIni -
      qty;


    const {
      error: insertError
    } =
      await supabaseClient
      .from("barang_keluar")
      .insert([{

        barang_id:
          barangId,

        qty:
          qty,

        tujuan:
          tujuan

      }]);


    if (insertError) {
      throw insertError;
    }


    const {
      error: updateError
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


    if (updateError) {
      throw updateError;
    }


    await saveActivity(
      `Barang keluar: ${barang.nama} (-${qty})`
    );


    showToast(
      "Barang keluar berhasil"
    );


    const form =
      getElement(
        "formKeluar"
      );


    if (form) {
      form.reset();
    }


    await Promise.all([

      loadBarang(),

      loadDashboard(),

      loadBarangKeluar(),

      loadSelectBarang(),

      loadSelectOpname()

    ]);


  } catch (error) {

    console.error(
      "Barang keluar:",
      error
    );

    showToast(
      error.message ||
      "Barang keluar gagal"
    );

  } finally {

    isSavingTransaksi =
      false;

  }

}


/* =========================================================
   26. LOAD BARANG KELUAR
========================================================= */

async function loadBarangKeluar() {

  try {

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
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    let html = "";


    (
      data || []
    ).forEach(
      item => {

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
              ${numberValue(
                item.qty
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
      getElement(
        "barangKeluarTable"
      );


    if (table) {

      table.innerHTML =
        html;

    }

  } catch (error) {

    console.error(
      "Load barang keluar:",
      error
    );

  }

}


/* =========================================================
   27. SUPPLIER MODAL
========================================================= */

function openSupplierModal() {

  const modal =
    getElement(
      "supplierModal"
    );


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeSupplierModal() {

  const modal =
    getElement(
      "supplierModal"
    );


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   28. LOAD SUPPLIER
========================================================= */

async function loadSupplier() {

  try {

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
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    let html = "";


    (
      data || []
    ).forEach(
      item => {

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
                item.alamat ||
                "-"
              )}
            </td>

            <td>

              <button
                type="button"
                onclick="editSupplier(${item.id})"
              >
                Edit
              </button>

              <button
                type="button"
                onclick="hapusSupplier(${item.id})"
              >
                Hapus
              </button>

            </td>

          </tr>

        `;

      }
    );


    const table =
      getElement(
        "supplierTable"
      );


    if (table) {

      table.innerHTML =
        html;

    }

  } catch (error) {

    console.error(
      "Load supplier:",
      error
    );

  }

}


/* =========================================================
   29. SAVE SUPPLIER
========================================================= */

async function saveSupplier() {

  if (isSavingSupplier) {
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

  const alamat =
    getValue(
      "supplierAlamat"
    );


  if (!nama) {

    showToast(
      "Nama supplier wajib diisi"
    );

    return;

  }


  isSavingSupplier =
    true;


  try {

    const payload = {

      nama,

      telepon,

      alamat

    };


    if (supplierEditId) {

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


      if (error) {
        throw error;
      }


      await saveActivity(
        `Edit supplier ${nama}`
      );


      showToast(
        "Supplier berhasil diperbarui"
      );


    } else {

      const {
        error
      } =
        await supabaseClient
        .from("supplier")
        .insert([
          payload
        ]);


      if (error) {
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


  } catch (error) {

    console.error(
      "Save supplier:",
      error
    );

    showToast(
      error.message ||
      "Gagal menyimpan supplier"
    );

  } finally {

    isSavingSupplier =
      false;

  }

}


/* =========================================================
   30. EDIT SUPPLIER
========================================================= */

async function editSupplier(id) {

  try {

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


    if (error) {
      throw error;
    }


    if (!data) {

      showToast(
        "Supplier tidak ditemukan"
      );

      return;

    }


    supplierEditId =
      id;


    setValue(
      "supplierNama",
      data.nama ||
      ""
    );

    setValue(
      "supplierTelepon",
      data.telepon ||
      ""
    );

    setValue(
      "supplierAlamat",
      data.alamat ||
      ""
    );


    openSupplierModal();


  } catch (error) {

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
   31. DELETE SUPPLIER
========================================================= */

async function hapusSupplier(id) {

  if (
    !confirm(
      "Yakin ingin menghapus supplier ini?"
    )
  ) {

    return;

  }


  try {

    const {
      data: supplier
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


    if (error) {
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


  } catch (error) {

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
   32. CLEAR SUPPLIER
========================================================= */

function clearSupplierForm() {

  setValue(
    "supplierNama",
    ""
  );

  setValue(
    "supplierTelepon",
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
   33. ACTIVITY LOG
========================================================= */

async function saveActivity(
  aktivitas
) {

  try {

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

        aktivitas:
          aktivitas,

        user_email:
          email

      }]);


    if (error) {

      /*
        Activity log tidak boleh
        menggagalkan transaksi utama.
      */

      console.error(
        "Activity log error:",
        error
      );

    }

  } catch (error) {

    console.error(
      "Activity log:",
      error
    );

  }

}


/* =========================================================
   34. LOAD ACTIVITY LOG
========================================================= */

async function loadActivity() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
      .from("activity_logs")
      .select(
        "*"
      )
      .order(
        "id",
        {
          ascending: false
        }
      )
      .limit(100);


    if (error) {
      throw error;
    }


    let html = "";


    (
      data || []
    ).forEach(
      item => {

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
                item.aktivitas ||
                "-"
              )}
            </td>

          </tr>

        `;

      }
    );


    const table =
      getElement(
        "activityTable"
      );


    if (table) {

      table.innerHTML =
        html;

    }

  } catch (error) {

    console.error(
      "Load activity:",
      error
    );

  }

}


/* =========================================================
   35. SEARCH ACTIVITY
========================================================= */

function searchActivity() {

  /*
    HTML saat ini belum mempunyai
    search activity.
    Fungsi tetap disediakan
    untuk pengembangan berikutnya.
  */

  const input =
    getElement(
      "searchActivity"
    );


  if (!input) {
    return;
  }


  const keyword =
    input.value
    .toLowerCase();


  document
    .querySelectorAll(
      "#activityTable tr"
    )
    .forEach(
      row => {

        row.style.display =
          row.innerText
          .toLowerCase()
          .includes(
            keyword
          )
          ? ""
          : "none";

      }
    );

}


/* =========================================================
   36. STOCK OPNAME FORM
========================================================= */

function createStockOpnameForm() {

  const page =
    getElement(
      "stockPage"
    );


  if (!page) {
    return;
  }


  if (
    getElement(
      "formOpname"
    )
  ) {

    return;

  }


  const panel =
    page.querySelector(
      ".panel"
    );


  if (!panel) {
    return;
  }


  const form =
    document.createElement(
      "form"
    );


  form.id =
    "formOpname";


  form.style.marginBottom =
    "20px";


  form.innerHTML = `

    <div class="opname-form">

      <select
        id="opnameBarang"
        required
      >

        <option value="">
          Pilih Barang
        </option>

      </select>

      <input
        type="number"
        id="opnameStok"
        min="0"
        step="1"
        placeholder="Stok Fisik"
        required
      >

      <input
        type="text"
        id="opnameKeterangan"
        placeholder="Keterangan"
      >

      <button
        type="submit"
      >
        Simpan Opname
      </button>

    </div>

  `;


  const title =
    panel.querySelector(
      "h3"
    );


  if (title) {

    title.insertAdjacentElement(
      "afterend",
      form
    );

  } else {

    panel.prepend(
      form
    );

  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      await submitStockOpname();

    }
  );

}


/* =========================================================
   37. LOAD SELECT OPNAME
========================================================= */

async function loadSelectOpname() {

  try {

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
          ascending: true
        }
      );


    if (error) {
      throw error;
    }


    let html =
      `
      <option value="">
        Pilih Barang
      </option>
      `;


    (
      data || []
    ).forEach(
      item => {

        html += `

          <option
            value="${item.id}"
          >
            ${escapeHTML(
              item.nama
            )}
            (Stok: ${numberValue(
              item.stok
            )})
          </option>

        `;

      }
    );


    const select =
      getElement(
        "opnameBarang"
      );


    if (select) {

      select.innerHTML =
        html;

    }

  } catch (error) {

    console.error(
      "Load select opname:",
      error
    );

  }

}


/* =========================================================
   38. LOAD STOCK OPNAME
========================================================= */

async function loadStockOpname() {

  try {

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
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    let html = "";


    (
      data || []
    ).forEach(
      item => {

        const selisih =
          numberValue(
            item.selisih
          );


        let status =
          "";


        if (selisih > 0) {

          status =
            `+${selisih}`;

        } else {

          status =
            String(
              selisih
            );

        }


        html += `

          <tr>

            <td>
              ${escapeHTML(
                item.barang?.nama ||
                "-"
              )}
            </td>

            <td>
              ${numberValue(
                item.stok_sistem
              )}
            </td>

            <td>
              ${numberValue(
                item.stok_fisik
              )}
            </td>

            <td>
              ${escapeHTML(
                status
              )}
            </td>

          </tr>

        `;

      }
    );


    /*
      HTML Anda menggunakan
      stockTable, bukan
      stockOpnameTable.
    */

    const table =
      getElement(
        "stockTable"
      );


    if (table) {

      table.innerHTML =
        html;

    }

  } catch (error) {

    console.error(
      "Load stock opname:",
      error
    );

  }

}


/* =========================================================
   39. SUBMIT STOCK OPNAME
========================================================= */

async function submitStockOpname() {

  if (isSavingOpname) {
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


  if (
    !Number.isInteger(
      barangId
    ) ||
    barangId <= 0
  ) {

    showToast(
      "Pilih barang terlebih dahulu"
    );

    return;

  }


  if (
    !Number.isInteger(
      stokFisik
    ) ||
    stokFisik < 0
  ) {

    showToast(
      "Stok fisik tidak valid"
    );

    return;

  }


  isSavingOpname =
    true;


  try {

    const {
      data: barang,
      error: barangError
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


    if (barangError) {
      throw barangError;
    }


    if (!barang) {

      throw new Error(
        "Barang tidak ditemukan"
      );

    }


    const stokSistem =
      numberValue(
        barang.stok
      );


    const selisih =
      stokFisik -
      stokSistem;


    const {
      error: opnameError
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

        selisih:
          selisih,

        keterangan:
          keterangan

      }]);


    if (opnameError) {
      throw opnameError;
    }


    const {
      error: updateError
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


    if (updateError) {
      throw updateError;
    }


    await saveActivity(
      `Stock opname: ${barang.nama} ${stokSistem} → ${stokFisik} (selisih ${selisih})`
    );


    showToast(
      "Stock opname berhasil"
    );


    const form =
      getElement(
        "formOpname"
      );


    if (form) {

      form.reset();

    }


    await Promise.all([

      loadStockOpname(),

      loadBarang(),

      loadDashboard(),

      loadSelectBarang(),

      loadSelectOpname()

    ]);


  } catch (error) {

    console.error(
      "Stock opname:",
      error
    );

    showToast(
      error.message ||
      "Stock opname gagal"
    );

  } finally {

    isSavingOpname =
      false;

  }

}


/* =========================================================
   40. EXPORT EXCEL
========================================================= */

async function exportExcel() {

  if (
    typeof XLSX ===
    "undefined"
  ) {

    showToast(
      "Library Excel belum tersedia"
    );

    return;

  }


  try {

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
            barang(
              nama
            )
          `)
          .order("id"),

        supabaseClient
          .from("barang_keluar")
          .select(`
            *,
            barang(
              nama
            )
          `)
          .order("id"),

        supabaseClient
          .from("supplier")
          .select("*")
          .order("id")

      ]);


    if (barangResult.error) {
      throw barangResult.error;
    }

    if (masukResult.error) {
      throw masukResult.error;
    }

    if (keluarResult.error) {
      throw keluarResult.error;
    }

    if (supplierResult.error) {
      throw supplierResult.error;
    }


    const barang =
      (
        barangResult.data ||
        []
      ).map(
        item => ({

          Kode:
            item.kode || "",

          Nama:
            item.nama || "",

          Kategori:
            item.kategori || "",

          Supplier:
            item.supplier || "",

          Rak:
            item.rak || "",

          Stok:
            numberValue(
              item.stok
            ),

          "Stok Minimum":
            numberValue(
              item.stok_minimum
            )

        })
      );


    const masuk =
      (
        masukResult.data ||
        []
      ).map(
        item => ({

          Tanggal:
            formatDate(
              item.created_at
            ),

          Barang:
            item.barang?.nama ||
            "",

          Qty:
            numberValue(
              item.qty
            ),

          Keterangan:
            item.keterangan ||
            ""

        })
      );


    const keluar =
      (
        keluarResult.data ||
        []
      ).map(
        item => ({

          Tanggal:
            formatDate(
              item.created_at
            ),

          Barang:
            item.barang?.nama ||
            "",

          Qty:
            numberValue(
              item.qty
            ),

          Tujuan:
            item.tujuan ||
            ""

        })
      );


    const supplier =
      (
        supplierResult.data ||
        []
      ).map(
        item => ({

          Nama:
            item.nama ||
            "",

          Telepon:
            item.telepon ||
            "",

          Alamat:
            item.alamat ||
            ""

        })
      );


    const workbook =
      XLSX.utils.book_new();


    const barangSheet =
      XLSX.utils.json_to_sheet(
        barang
      );


    const masukSheet =
      XLSX.utils.json_to_sheet(
        masuk
      );


    const keluarSheet =
      XLSX.utils.json_to_sheet(
        keluar
      );


    const supplierSheet =
      XLSX.utils.json_to_sheet(
        supplier
      );


    XLSX.utils.book_append_sheet(
      workbook,
      barangSheet,
      "Stok Barang"
    );


    XLSX.utils.book_append_sheet(
      workbook,
      masukSheet,
      "Barang Masuk"
    );


    XLSX.utils.book_append_sheet(
      workbook,
      keluarSheet,
      "Barang Keluar"
    );


    XLSX.utils.book_append_sheet(
      workbook,
      supplierSheet,
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


  } catch (error) {

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
   41. REFRESH DATA
========================================================= */

async function refreshAllData() {

  try {

    await Promise.allSettled([

      loadDashboard(),

      loadBarang(),

      loadBarangMasuk(),

      loadBarangKeluar(),

      loadSupplier(),

      loadActivity(),

      loadSelectBarang(),

      loadSelectOpname(),

      loadStockOpname()

    ]);

  } catch (error) {

    console.error(
      "Refresh all:",
      error
    );

  }

}


/* =========================================================
   42. AUTO REFRESH
========================================================= */

function startAutoRefresh() {

  stopAutoRefresh();


  /*
    Hanya dashboard yang
    diperbarui otomatis.
    
    Ini sengaja agar aplikasi
    tetap ringan.
  */

  autoRefreshTimer =
    setInterval(
      async () => {

        try {

          const {
            data
          } =
            await supabaseClient
            .auth
            .getSession();


          if (
            data &&
            data.session
          ) {

            await loadDashboard();

          }

        } catch (error) {

          console.error(
            "Auto refresh:",
            error
          );

        }

      },
      30000
    );

}


function stopAutoRefresh() {

  if (
    autoRefreshTimer
  ) {

    clearInterval(
      autoRefreshTimer
    );

    autoRefreshTimer =
      null;

  }

}


/* =========================================================
   43. VISIBILITY CHANGE
========================================================= */

document.addEventListener(
  "visibilitychange",
  async () => {

    if (
      document.visibilityState !==
      "visible"
    ) {

      return;

    }


    try {

      const {
        data
      } =
        await supabaseClient
        .auth
        .getSession();


      if (
        data &&
        data.session
      ) {

        await loadDashboard();

      }

    } catch (error) {

      console.error(
        "Visibility refresh:",
        error
      );

    }

  }
);


/* =========================================================
   44. ONLINE / OFFLINE
========================================================= */

window.addEventListener(
  "online",
  () => {

    showToast(
      "Koneksi internet kembali"
    );

    loadDashboard();

  }
);


window.addEventListener(
  "offline",
  () => {

    showToast(
      "Koneksi internet terputus"
    );

  }
);


/* =========================================================
   45. ESCAPE CLOSE MODAL
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {

      return;

    }


    document
      .querySelectorAll(
        ".modal"
      )
      .forEach(
        modal => {

          modal.classList.add(
            "hidden"
          );

        }
      );

  }
);


/* =========================================================
   46. CLOSE MODAL WHEN CLICK OUTSIDE
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      event.target.classList.contains(
        "modal"
      )
    ) {

      event.target.classList.add(
        "hidden"
      );

    }

  }
);


/* =========================================================
   47. AUTH STATE
========================================================= */

supabaseClient
  .auth
  .onAuthStateChange(
    (
      event,
      session
    ) => {

      if (
        event ===
        "SIGNED_OUT"
      ) {

        stopAutoRefresh();

        return;

      }


      if (
        session &&
        !appInitialized
      ) {

        /*
          Jangan await langsung
          di callback Auth.
        */

        setTimeout(
          () => {

            showApplication();

          },
          0
        );

      }

    }
  );


/* =========================================================
   48. INITIALIZE FORMS
========================================================= */

function initializeForms() {

  setupFormMasuk();

  setupFormKeluar();

  createStockOpnameForm();

}


/* =========================================================
   49. GLOBAL FUNCTIONS
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

window.searchActivity =
  searchActivity;

window.exportExcel =
  exportExcel;

window.submitStockOpname =
  submitStockOpname;

window.loadStockOpname =
  loadStockOpname;

window.loadSelectOpname =
  loadSelectOpname;

window.refreshAllData =
  refreshAllData;


/* =========================================================
   50. START
========================================================= */

function startInventra() {

  hideLoadingScreen();

  initializeForms();

  checkSession();

}


/*
  Karena app.js dipanggil di bagian
  paling bawah HTML, DOM sebenarnya
  sudah tersedia.

  Tetapi tetap dibuat aman jika nanti
  posisi script dipindahkan ke <head>.
*/

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    startInventra,
    {
      once: true
    }
  );

} else {

  startInventra();

}


/* =========================================================
   INVENTRA PRO v1.0
   PRODUCTION READY
========================================================= */

console.log(
  "INVENTRA PRO v1.0 - Production loaded."
);
```
