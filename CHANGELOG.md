## [1.4.1](https://github.com/Andival-Sei/pennora/compare/v1.4.0...v1.4.1) (2025-12-31)

# [1.4.0](https://github.com/Andival-Sei/pennora/compare/v1.3.2...v1.4.0) (2025-12-31)

### Features

- **monitoring:** интегрировать Sentry для отслеживания ошибок ([4476db4](https://github.com/Andival-Sei/pennora/commit/4476db4cedc55a47aa24b396310264824ada0278))

## [1.3.2](https://github.com/Andival-Sei/pennora/compare/v1.3.1...v1.3.2) (2025-12-29)

### Performance Improvements

- **bundle:** добавить lazy loading для тяжелых компонентов ([6503487](https://github.com/Andival-Sei/pennora/commit/6503487a88222c014df76e573ca6c52a02ab4d2b))

## [1.3.1](https://github.com/Andival-Sei/pennora/compare/v1.3.0...v1.3.1) (2025-12-29)

### Performance Improvements

- **dashboard:** оптимизировать загрузку последних транзакций на главной ([84e01c9](https://github.com/Andival-Sei/pennora/commit/84e01c942efe46a878bfcaae737b04e0d1ed9e1c))

# [1.3.0](https://github.com/Andival-Sei/pennora/compare/v1.2.2...v1.3.0) (2025-12-29)

### Features

- добавить компонент ErrorBoundary для обработки ошибок рендеринга ([3566e19](https://github.com/Andival-Sei/pennora/commit/3566e1930bbfbf754a7eb82ccf76a09d883745ce))

## [1.1.1](https://github.com/Andival-Sei/pennora/compare/v1.1.0...v1.1.1) (2025-12-28)

### Bug Fixes

- **ui:** исправить layout shift при открытии модальных окон ([0f97b7a](https://github.com/Andival-Sei/pennora/commit/0f97b7a860109bf0c17b97fe018c89f8228ffaac))

# [1.1.0](https://github.com/Andival-Sei/pennora/compare/v1.0.0...v1.1.0) (2025-12-28)

### Features

- **categories:** разделение категории "Фрукты и ягоды" на "Фрукты" и "Ягоды", добавление подкатегории "Туалетная бумага" ([0d7e461](https://github.com/Andival-Sei/pennora/commit/0d7e4611e01f160a645c5ea4c01cbb8f7b7c4f5e))

# 1.0.0 (2025-12-28)

### Bug Fixes

- **auth:** исправить редирект после выхода и Google OAuth логин ([6d1a6aa](https://github.com/Andival-Sei/pennora/commit/6d1a6aafd95fad698f17f8ffa2b6a35f92df7a8e))
- **categories:** исправить ошибку с пустым значением Select.Item ([1da2f71](https://github.com/Andival-Sei/pennora/commit/1da2f71a1174c85456871f50f84d9693e9d0a781))
- **dashboard:** улучшить логику онбординга и обработку ошибок ([4415c1a](https://github.com/Andival-Sei/pennora/commit/4415c1ab82e23ef7031f55fa821f43958f1d8adc))
- **onboarding:** заменить watch() на useWatch для совместимости с React Compiler ([082fd0e](https://github.com/Andival-Sei/pennora/commit/082fd0e38d63a0c2852e96760e11c5b2a0b7abfa))
- **onboarding:** исправить доступ, баланс и кеш транзакций ([70b6425](https://github.com/Andival-Sei/pennora/commit/70b6425de59bb4b4fb66b7cab137b745177736e5))
- **onboarding:** убрать обязательность выбора валюты в схеме валидации ([fb6ecfa](https://github.com/Andival-Sei/pennora/commit/fb6ecfa002402055ffdd80e371af2eff8b7afe89))
- **proxy, page, hero-section:** улучшить обработку ошибок и логику отображения пользователя ([e24e84c](https://github.com/Andival-Sei/pennora/commit/e24e84cd1b5565db412e37ca51623273ddca4ae0))
- **supabase:** добавить обработку ошибок подключения к Supabase в dev режиме ([f79491d](https://github.com/Andival-Sei/pennora/commit/f79491db510e9bfa8b9389187296c8694bf479f1))
- **tests:** исправить линтер и улучшить тесты для компонентов аутентификации ([c90ffc4](https://github.com/Andival-Sei/pennora/commit/c90ffc48b18e5bc86ca3e7f1ecfe057655ad8111))
- **tests:** улучшить типизацию и обработку ошибок в тестах компонентов ([3a7582f](https://github.com/Andival-Sei/pennora/commit/3a7582f0e50d39c07be4318dc55fa5a947d58d8a))
- **transactions:** исправить ошибку гидратации с DialogTrigger ([3c4c81e](https://github.com/Andival-Sei/pennora/commit/3c4c81e750d8314d4e42f6c908d54d99a04f7dad))
- **transactions:** улучшить обработку форм транзакций и валидацию ([9d34bbe](https://github.com/Andival-Sei/pennora/commit/9d34bbe8d6d7203d846918e30dc0f10597873e16))
- **ui:** исправлен календарь для react-day-picker v9 ([feb5876](https://github.com/Andival-Sei/pennora/commit/feb58766f0934c96fd552e379f00295db6d660be))
- **url:** обновить базовый URL для продакшена на vercel.app ([c7319d7](https://github.com/Andival-Sei/pennora/commit/c7319d792033b7af41bc7c61a241bc4d8ef4d967))
- заменён getSession() на getUser() для безопасности ([44f510b](https://github.com/Andival-Sei/pennora/commit/44f510b036417b143789b543389da3e1adf2dedd))
- исправить ошибки линтинга для CI ([161162f](https://github.com/Andival-Sei/pennora/commit/161162f853f073d1dae5f2f4ef53d29900eed468))
- исправить ошибки линтинга и форматирование кода ([9debdfa](https://github.com/Andival-Sei/pennora/commit/9debdfa493a4b80df2a791cc5252a632c3d67bf0))
- исправить предупреждения в CI workflow ([eba0ad8](https://github.com/Andival-Sei/pennora/commit/eba0ad813d1237f20a170d7c23921783e2dc90bd))
- исправить тип availableYears в MonthYearSelector ([29a999b](https://github.com/Andival-Sei/pennora/commit/29a999b778fcaafd1c292206b066020cf5445782))
- исправлена ошибка TypeScript в ExchangeRates интерфейсе ([f2f642c](https://github.com/Andival-Sei/pennora/commit/f2f642ca36f28028446ab7c0cd6adac0c955ddcf))
- исправлена типизация в performance-тестах ([45c992e](https://github.com/Andival-Sei/pennora/commit/45c992e99b701c739cabbfeaf02cfff8d75460ca))
- исправлены импорты после разрешения конфликта ([fcb8d47](https://github.com/Andival-Sei/pennora/commit/fcb8d478337aee13b17a76b574ecde2f7a68fb6c))

### Features

- **accounts:** добавлено редактирование счетов ([731a6c8](https://github.com/Andival-Sei/pennora/commit/731a6c806d444b1136d2b9b9710b4c8b229351e2))
- **accounts:** улучшить обработку форм и взаимодействие с пользователем ([d489882](https://github.com/Andival-Sei/pennora/commit/d4898820bf9fc9580aff7c79fe5fd96d6dcb28ee))
- **account:** добавить функциональность удаления аккаунта и подтверждения действия ([2c4c4fc](https://github.com/Andival-Sei/pennora/commit/2c4c4fc5a52b7384af01cea0793b329f89cc0cdc))
- **auth:** добавить функциональность повторной отправки подтверждения email ([8f62d25](https://github.com/Andival-Sei/pennora/commit/8f62d25d96fcd7473f6f21f1f5e296b41ccfdf47))
- **auth:** реализовать страницы аутентификации и настройки ([f62a218](https://github.com/Andival-Sei/pennora/commit/f62a2187ba44a365a037d91c0d1e122f4ab702c2))
- **caching:** добавить централизованную систему инвалидации кеша и обновить документацию ([a488248](https://github.com/Andival-Sei/pennora/commit/a488248963e6e4482e2fb2c63a4b5e8efa4477ca))
- **categories:** добавить поддержку системных категорий и улучшить логику удаления ([efdb154](https://github.com/Andival-Sei/pennora/commit/efdb1541d7c61814cb40c31b6c621e5378a22cc4))
- **categories:** добавить функциональность удаления категорий с подтверждением ([0ed2114](https://github.com/Andival-Sei/pennora/commit/0ed2114a682b0eaa4a3f7d5db17e2be43235ae17))
- **categories:** добавлена система управления категориями ([eba54e5](https://github.com/Andival-Sei/pennora/commit/eba54e597c67057aaf03930f5225ac5407286135))
- **config:** улучшение оптимизации изображений и заголовков безопасности в next.config.ts ([a1564bb](https://github.com/Andival-Sei/pennora/commit/a1564bbbce726e81255929c568328fa11044ebb2))
- **dashboard:** добавить базовую статистику за текущий месяц ([0b757dc](https://github.com/Andival-Sei/pennora/commit/0b757dc977896972eeaff182edbbaf6e92ae9e66))
- **dashboard:** добавить иконки в заголовки страниц панели управления ([d91f2aa](https://github.com/Andival-Sei/pennora/commit/d91f2aa95d9cd9e25250958d374dd6b6967899ca))
- **dashboard:** добавить страницы для управления транзакциями, категориями и бюджетами ([40605c1](https://github.com/Andival-Sei/pennora/commit/40605c1c50c936668e13596cb48b245d12094bd9))
- **dashboard:** добавить управление аккаунтами и настройки пользователя ([8b3b3d4](https://github.com/Andival-Sei/pennora/commit/8b3b3d45587bf647f3ddc44048e61fe6f642e81e))
- **dashboard:** добавить функциональность онбординга и сброса аккаунтов ([f905dc2](https://github.com/Andival-Sei/pennora/commit/f905dc2824264d0596eaceed1dd4b29ed6e170dc))
- **dashboard:** обновить интерф��йс и добавить функциональность выхода ([9ab0f63](https://github.com/Andival-Sei/pennora/commit/9ab0f632c989cbf2fb9a78c8e7fb08fd43829f7c))
- **dashboard:** улучшить дизайн главной страницы дашборда ([17a4e81](https://github.com/Andival-Sei/pennora/commit/17a4e817cbbce8ea7f14b13cbbc5d1403af28297))
- **demo:** добавить демонстрационный интерфейс с онбордингом и дашбордом ([06b228b](https://github.com/Andival-Sei/pennora/commit/06b228b458af71e873abd92f1e4efa07015dc6a6))
- **errors:** унифицировать обработку ошибок и валидацию форм ([e2134b5](https://github.com/Andival-Sei/pennora/commit/e2134b5b8936383d52e0296f7c0a1b76ec1d1942))
- **landing:** добавить переводы и улучшить интерфейс компонентов ([bd4ff7f](https://github.com/Andival-Sei/pennora/commit/bd4ff7f4fcc705d37064129ff343e6ba3f378d85))
- **landing:** добавить поддержку локализации валюты в компонент PhoneMockup ([2d80702](https://github.com/Andival-Sei/pennora/commit/2d8070207fc14eb9a2f30349da8db2cb4023cacb))
- **landing:** обновить дизайн лендинга и страниц политики ([3ffe279](https://github.com/Andival-Sei/pennora/commit/3ffe279b06f4fd013e0e73c3c1f1e78c803a58bf))
- **landing:** улучшить дизайн лендинга и добавить страницы политики ([a5e698f](https://github.com/Andival-Sei/pennora/commit/a5e698f52622b76b3fd3e0a12ff9e9c340092c2d))
- **landing:** улучшить отображение теней в компоненте PhoneMockup ([efb8aed](https://github.com/Andival-Sei/pennora/commit/efb8aedcdbde07c30feaad35bcabf9fe421ee61c))
- **license:** добавить страницу лицензии и обновить информацию о лицензии ([d0eb266](https://github.com/Andival-Sei/pennora/commit/d0eb266478642575ed297efa0d1ce4e74e121beb))
- **metadata:** добавить поддержку метаданных и иконок для PWA ([facd26b](https://github.com/Andival-Sei/pennora/commit/facd26b91fd1d145a22fb053aa29754d4dd9d2c6))
- **navigation:** обновить компонент нижней навигации с улучшенной анимацией и стилями ([8dd8358](https://github.com/Andival-Sei/pennora/commit/8dd83580341f028ce1b25ef1c727da48d2e19945))
- **proxy:** добавить прокси для авторизации и редиректов ([ae5ebee](https://github.com/Andival-Sei/pennora/commit/ae5ebeed31515a56d51f8f323784937f33753758))
- **pwa:** добавить поддержку PWA с оффлайном через официальный подход Next.js ([03bf431](https://github.com/Andival-Sei/pennora/commit/03bf4314c9e050d481ee3ff159e9c047fbe66897))
- **receipts:** добавить функциональность обработки чеков с поддержкой различных форматов ([0bac1fb](https://github.com/Andival-Sei/pennora/commit/0bac1fbe96de9e44c5838f757a090873605b7d14))
- **receipts:** добавить функциональность обработки чеков через загрузку и камеру ([88923fc](https://github.com/Andival-Sei/pennora/commit/88923fcb23522cd7f7026b70f8b862ad7dce6a2a))
- **seo:** добавить комплексную SEO оптимизацию ([0dbe3a6](https://github.com/Andival-Sei/pennora/commit/0dbe3a6da7e8f3fcbb182ca79dc13caccd9ecbc9))
- **settings:** добавить функциональность изменения email с верификацией ([b3acc34](https://github.com/Andival-Sei/pennora/commit/b3acc34788c70e646958b40d6fb782af5b80ec7d))
- **settings:** улучшить обработку формы пароля с использованием useWatch ([5143f8a](https://github.com/Andival-Sei/pennora/commit/5143f8af605535af85c64f396c5c260559b5fd39))
- **sync:** добавить анимацию для статуса синхронизации ([fef121e](https://github.com/Andival-Sei/pennora/commit/fef121e7e781e632a1b352052bed482343063b9d))
- **tests:** добавить моки для мутаций аккаунтов в тестах ([1e0856d](https://github.com/Andival-Sei/pennora/commit/1e0856d1d63655b78b98e6e154576f42366676a3))
- **tests:** добавить тесты для компонентов и валидаций ([9ec3e31](https://github.com/Andival-Sei/pennora/commit/9ec3e319f20372517e32e49e8b63b0e43962165a))
- **transactions:** добавить анимацию сообщений об ошибках в форму транзакций ([5a412a1](https://github.com/Andival-Sei/pennora/commit/5a412a1bdf12bd161f9486bc3f598f053f67aa53))
- **transactions:** добавить поддержку многопозиционных транзакций ([595a92a](https://github.com/Andival-Sei/pennora/commit/595a92a47eae5108a2a122156ae1606e5f089c23))
- **transactions:** добавить поддержку переводов между счетами ([d3026d4](https://github.com/Andival-Sei/pennora/commit/d3026d40d4594765c3509047fb7934d8f4c50d05))
- **transactions:** заменить confirm() на AlertDialog для удаления ([c0dcebe](https://github.com/Andival-Sei/pennora/commit/c0dcebe5e47e5a7024cc69a126945e761aca45b2))
- **transactions:** обновить форму транзакций с новым текстовым полем и улучшенной логикой ([7276f19](https://github.com/Andival-Sei/pennora/commit/7276f196ac749966ad1e1de50004c6340b176bb0))
- **transactions:** обновить форму транзакций с новыми полями для аккаунтов ([95988d6](https://github.com/Andival-Sei/pennora/commit/95988d6e396880f87895436baff516169728ac8e))
- **transactions:** улучшить диалог ввода чека с анимацией и сбросом состояния ([46af55d](https://github.com/Andival-Sei/pennora/commit/46af55d1825b0f0eb4c2ec5e48029b80d15309cd))
- **utils:** добавить функцию getAppUrl для динамического получения базового URL приложения ([127406a](https://github.com/Andival-Sei/pennora/commit/127406aec04f051c43bdab3f0bdd18012dec304e))
- аутентификация, валидация форм, Google OAuth, i18n, страница настроек ([be61cbb](https://github.com/Andival-Sei/pennora/commit/be61cbb66583f3e7f519562fceb6303adb59c3de))
- внедрение кеширования через TanStack Query ([bf931b7](https://github.com/Andival-Sei/pennora/commit/bf931b7c7a47bb0eac030d53a505b7ccfeb45613))
- добавить скрипт check:all для последовательной проверки кода ([6d61efc](https://github.com/Andival-Sei/pennora/commit/6d61efc80453e3fabffad949265fe33390faa569))
- добавить страницу статистики и улучшить парсинг чеков ([69f5e54](https://github.com/Andival-Sei/pennora/commit/69f5e548c4dd6ad67fb212af8613f315ca1b9c08))
- добавлена полноценная лендинг-страница с анимациями ([2a84ad5](https://github.com/Andival-Sei/pennora/commit/2a84ad5247348c6e6821e0f4986d2becd4889b21))
- переделать landing page с современным дизайном ([4cfb15c](https://github.com/Andival-Sei/pennora/commit/4cfb15c98a492b55f27d0942de822a7d9b692281))
- реализация офлайн-режима и синхронизации данных ([e84adc8](https://github.com/Andival-Sei/pennora/commit/e84adc867f5bbb42115b815ff25cbb75ff462975))

### Performance Improvements

- **db:** оптимизировать работу с базой данных Supabase ([e356ea7](https://github.com/Andival-Sei/pennora/commit/e356ea76e8083eb9b3d1ec5636b0a20020100ce3))
- оптимизация производительности dev-сервера ([67f28c8](https://github.com/Andival-Sei/pennora/commit/67f28c869c9c75624ae739fa17b1c1afb2400dae))

# Changelog

Все значимые изменения в этом проекте будут документироваться в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и этот проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

## [Unreleased]

### Добавлено

- Автоматическая система релизов с semantic-release
- CHANGELOG.md для отслеживания изменений
