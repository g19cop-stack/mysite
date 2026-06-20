// Показать приветствие
function showAlert() {
    alert('Отлично! Давай развивать сайт дальше. Что хочешь добавить?');
}

// Обработка формы
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Спасибо! Сообщение отправлено (в реальном проекте здесь будет отправка на сервер).');
    this.reset();
});

// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});