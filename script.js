// Fungsi untuk tab produk
document.addEventListener('DOMContentLoaded', function() {
    // Hanya jalankan jika ada tab-btn di halaman
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Hapus active class dari semua tombol
                tabBtns.forEach(b => b.classList.remove('active'));
                
                // Tambahkan active class ke tombol yang diklik
                this.classList.add('active');
                
                // Sembunyikan semua daftar produk
                document.querySelectorAll('.product-list').forEach(list => {
                    list.classList.add('hidden');
                });
                
                // Tampilkan daftar produk yang dipilih
                const game = this.getAttribute('data-game');
                document.getElementById(`${game}-products`).classList.remove('hidden');
            });
        });
    }

    // Fungsi tombol beli
    const buyBtns = document.querySelectorAll('.buy-btn');
    if (buyBtns.length > 0) {
        buyBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const productCard = this.closest('.product-card');
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = productCard.querySelector('.price').textContent;
                
                alert(`Anda akan membeli:\n${productName}\nHarga: ${productPrice}\n\nFitur checkout akan diimplementasikan lebih lanjut.`);
            });
        });
    }
});
