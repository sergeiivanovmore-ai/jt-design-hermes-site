# AGENTS.md — jt-design-hermes-site

## Назначение
Сайт дизайнера интерьеров. Статический (HTML/CSS/JS, без сборки на первом этапе).
Публикуется в двух окружениях: staging для превью, prod после approve.

## Структура репозитория
```
├── src/                         # Исходники сайта — единственная рабочая папка
│   ├── index.html               # Главная
│   ├── portfolio.html           # Портфолио
│   ├── services.html            # Услуги
│   ├── contacts.html            # Контакты
│   ├── css/styles.css
│   ├── js/main.js
│   └── assets/
├── .github/workflows/           # CI/CD (появится на этапе прод-контура)
├── Dockerfile                   # (появится на этапе прод-контура)
├── nginx.conf                   # (появится на этапе прод-контура)
├── .gitignore
└── README.md
```

## Окружения
| Среда | URL | Как обновляется |
|---|---|---|
| Staging | https://stg.jt-design.ru | Автоматически: bind-mount на `src/`, изменения видны мгновенно |
| Prod | https://jt-design.ru | Только через merge в `main` после approve |

## Конвенции
- **Язык кода**: HTML5, CSS3, vanilla JS. Без фреймворков и сборщиков на первом этапе.
- **Стили**: единый `src/css/styles.css`, CSS-переменные для палитры и типографики.
- **JS**: единый `src/js/main.js`, без глобальных переменных.
- **Ссылки**: относительные (без ведущего `/`), чтобы одинаково работали на staging и prod.
- **Изображения**: WebP, lazy-loading, атрибуты `width`/`height` для предотвращения сдвигов.
- **Доступность**: контраст WCAG AA, alt-тексты, навигация с клавиатуры.

## Палитра и типографика
- Палитра: тёплые нейтральные тона (бежевый, тёмно-серый, тёплый белый).
- Заголовки: serif.
- Текст: sans-serif.
- Палитра и шрифты фиксируются в CSS-переменных в `:root` — менять только с явного запроса.

## Git и ветки
- Ветка по умолчанию — `main` (защищена, только через PR).
- Рабочие ветки: `feature/<slug>`, `fix/<slug>`.
- Коммиты: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Язык сообщений коммитов — русский, префикс — английский.

## Процесс
1. Создай ветку `feature/<slug>`.
2. Пиши код только в `src/`.
3. Локально проверь:
   `docker run --rm -p 8080:80 -v $PWD/src:/usr/share/nginx/html:ro nginx:1.27-alpine`
4. `git add`, `git commit`, `git push origin <branch>`.
5. Открой PR в `main`: `gh pr create --base main`.
6. Отчитайся в Telegram: «Preview: https://stg.jt-design.ru · PR: <ссылка>».

## Что не делать
- Не пушить в `main` напрямую.
- Не трогать прод-контейнер `jt-site-prod`.
- Не изменять `.github/workflows/`, `Dockerfile`, `nginx.conf`, `docker-compose*.yml` без явного запроса.
- Не коммитить секреты, токены, пароли.
- Не добавлять зависимости (npm, pip) без согласования — сайт пока статический.

## Полезные команды
```bash
# Проверить, что git настроен
git -C /opt/data/workspace/jt-design-hermes-site status

# Локальный предпросмотр
docker run --rm -p 8080:80 -v $PWD/src:/usr/share/nginx/html:ro nginx:1.27-alpine

# Проверить staging
curl -I https://stg.jt-design.ru
```
