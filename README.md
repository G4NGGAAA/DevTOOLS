# Arya DevTools

Arya DevTools adalah **mini DevTools panel berbasis JavaScript** yang dapat dijalankan langsung di dalam halaman website menggunakan **bookmarklet**.
Tool ini dirancang untuk membantu developer memahami bagaimana sebuah website melakukan **network request**, memuat **resource**, dan berinteraksi dengan **API**.

Arya DevTools tidak memerlukan instalasi ekstensi browser. Cukup menjalankan script melalui bookmark, maka panel debugging akan muncul di halaman.

---

# Fitur Utama

### Network Logger

Menangkap request yang dilakukan oleh halaman web, termasuk:

* `fetch()`
* `XMLHttpRequest`

Informasi yang ditampilkan:

* Method (GET / POST / dll)
* Status code
* Waktu request
* URL endpoint

---

### Request Viewer

Menampilkan detail request yang dipilih:

* URL request
* Method request
* Request body (untuk POST / PUT)

Ini berguna untuk melihat data yang dikirim ke server.

---

### Response Viewer

Menampilkan response dari server.

Fitur:

* JSON otomatis diformat
* Menampilkan response text mentah
* Mempermudah membaca response API

---

### Endpoint Scanner

Mencari endpoint yang ditemukan di dalam script halaman.

Tool akan memindai:

* `<script>`
* kode JavaScript dalam halaman

Kemudian menampilkan semua URL yang ditemukan.

---

### Filter Request

Memfilter request berdasarkan method.

Contoh:

* hanya GET
* hanya POST

Ini membantu menemukan request tertentu dengan cepat.

---

### Search Request

Mencari request berdasarkan URL.

Contoh penggunaan:

mencari endpoint yang mengandung kata:

```
login
api
user
```

---

### Request Replay

Mengirim ulang request yang telah tercatat.

Fungsi ini berguna untuk:

* menguji endpoint
* debugging API
* melihat apakah server memberikan response yang sama

---

### Export Session

Menyimpan semua log network ke file JSON.

File ini dapat dianalisis kembali atau dibagikan kepada developer lain.

---

### Draggable Panel

Panel DevTools dapat dipindahkan dengan cara drag pada bagian header.

---

### Resizable Panel

Panel dapat diperbesar atau diperkecil dengan menarik sudut panel.

---

### Minimize Panel

Menyembunyikan isi panel tanpa menutup tool.

---

### Close Panel

Menutup DevTools sepenuhnya dari halaman.

---

### Dark Theme

Menggunakan tema biru-hitam yang nyaman untuk debugging.

---

# Struktur Project

```bash
arya-devtools/
│
├─ src/
│  └─ main.js
│
├─ bookmarklet.js
├─ package.json
└─ README.md
```

Penjelasan file:

**src/main.js**
Script utama yang menjalankan seluruh fitur DevTools.

**bookmarklet.js**
Script bookmark yang digunakan untuk menjalankan DevTools di halaman web.

**package.json**
Metadata project.

**README.md**
Dokumentasi penggunaan.

---

# Cara Instalasi

## 1. Upload Project ke GitHub

Upload semua file project ke repository GitHub.

Contoh struktur repository:

```
https://github.com/G4NGGGAAA/DevTOOLS
```

---

## 2. Ambil URL Raw Script

Buka file:

```
src/main.js
```

Klik tombol **Raw** lalu salin URL.

Contoh:

```
https://raw.githubusercontent.com/G4NGGAAA/DevTOOLS/main/src/main.js
```

---

# Cara Menggunakan Arya DevTools

## 1. Buat Bookmark Baru

Di browser:

1. buka menu bookmark
2. pilih **Add bookmark**
3. beri nama misalnya

```
Arya DevTools
```

---

## 2. Masukkan Bookmarklet

Isi URL bookmark dengan script berikut:

```
javascript:(async()=>{eval(await (await fetch("https://raw.githubusercontent.com/G4NGGAAA/DevTOOLS/main/src/main.js")).text())})();
```

---

## 3. Jalankan Tool

Langkah penggunaan:

1. buka website apa saja
2. klik bookmark **Arya DevTools**
3. panel DevTools akan muncul di halaman

---

# Cara Menggunakan Fitur

## Melihat Network Request

1. klik tab **Network**
2. semua request akan ditampilkan

Format:

```
[index] METHOD STATUS TIME
URL
```

Contoh:

```
[0] GET 200 120ms
https://api.site.com/user
```

---

## Melihat Request Detail

1. klik **Request**
2. masukkan index request

Tool akan menampilkan:

* URL
* Method
* Body

---

## Melihat Response

1. klik **Response**
2. masukkan index request

Jika response berupa JSON, tool akan otomatis memformatnya.

---

## Mencari Endpoint

1. klik **Endpoints**
2. tool akan memindai script halaman
3. semua URL akan ditampilkan

---

## Filter Request

1. klik **Filter**
2. masukkan method

contoh:

```
GET
POST
```

---

## Search Request

1. klik **Search**
2. masukkan kata kunci URL

contoh:

```
api
login
user
```

---

## Replay Request

1. klik **Replay**
2. masukkan index request

Tool akan mengirim ulang request tersebut.

---

## Export Network Log

1. klik **Export**
2. file JSON akan diunduh

File berisi semua log request yang telah tercatat.

---

# Contoh Use Case

Arya DevTools dapat digunakan untuk:

* debugging API request
* memahami bagaimana website melakukan network call
* melihat response JSON
* mempelajari endpoint API pada aplikasi web
* melakukan testing ulang request

---

# Batasan Tool

Arya DevTools hanya menangkap request yang dilakukan oleh halaman setelah tool dijalankan.

Request yang terjadi sebelum tool dijalankan tidak akan tercatat.

---

# License

MIT License

Project ini bebas digunakan, dimodifikasi, dan didistribusikan kembali sesuai lisensi MIT.
