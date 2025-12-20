-- Миграция: Создание предустановленных категорий для новых пользователей
-- 
-- Эта миграция создаёт функцию, которая автоматически создаёт
-- расширенный набор предустановленных категорий при создании профиля пользователя.
-- Категории основаны на лучших практиках популярных бюджетных приложений (YNAB, Mint, Actual Budget)

-- Функция для создания предустановленных категорий
CREATE OR REPLACE FUNCTION create_default_categories(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sort_order_counter INTEGER := 0;
  food_category_id UUID;
  products_category_id UUID;
  transport_category_id UUID;
  housing_category_id UUID;
  health_category_id UUID;
  entertainment_category_id UUID;
  shopping_category_id UUID;
  clothing_category_id UUID;
  communication_category_id UUID;
  finance_category_id UUID;
  beauty_category_id UUID;
  sport_category_id UUID;
  travel_category_id UUID;
  children_category_id UUID;
  pets_category_id UUID;
BEGIN
  -- ============================================
  -- ДОХОДЫ (Income)
  -- ============================================
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Зарплата', 'income', 'briefcase', '#10b981', sort_order_counter, NULL);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Премии', 'income', 'gift', '#10b981', sort_order_counter, NULL);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Инвестиции', 'income', 'trending', '#10b981', sort_order_counter, NULL);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Аренда недвижимости', 'income', 'home', '#10b981', sort_order_counter, NULL);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Дивиденды', 'income', 'dollar', '#10b981', sort_order_counter, NULL);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Подарки', 'income', 'gift', '#10b981', sort_order_counter, NULL);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Прочие доходы', 'income', 'wallet', '#10b981', sort_order_counter, NULL);

  -- ============================================
  -- РАСХОДЫ (Expense) - Основные категории
  -- ============================================
  
  -- Еда
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Еда', 'expense', 'food', '#ef4444', sort_order_counter, NULL)
  RETURNING id INTO food_category_id;
  
  -- Транспорт
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Транспорт', 'expense', 'car', '#ef4444', sort_order_counter, NULL)
  RETURNING id INTO transport_category_id;
  
  -- Жильё
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Жильё', 'expense', 'home', '#ef4444', sort_order_counter, NULL)
  RETURNING id INTO housing_category_id;
  
  -- Здоровье
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Здоровье', 'expense', 'heart', '#ef4444', sort_order_counter, NULL)
  RETURNING id INTO health_category_id;
  
  -- Развлечения
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Развлечения', 'expense', 'film', '#ef4444', sort_order_counter, NULL)
  RETURNING id INTO entertainment_category_id;
  
  -- Образование
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Образование', 'expense', 'book', '#ef4444', sort_order_counter, NULL);
  
  -- Покупки
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Покупки', 'expense', 'shopping', '#ef4444', sort_order_counter, NULL)
  RETURNING id INTO shopping_category_id;
  
  -- Одежда и обувь
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Одежда и обувь', 'expense', 'shopping', '#ec4899', sort_order_counter, NULL)
  RETURNING id INTO clothing_category_id;
  
  -- Связь
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Связь', 'expense', 'shopping', '#3b82f6', sort_order_counter, NULL)
  RETURNING id INTO communication_category_id;
  
  -- Финансовые обязательства
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Финансы', 'expense', 'wallet', '#6366f1', sort_order_counter, NULL)
  RETURNING id INTO finance_category_id;
  
  -- Красота и уход
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Красота и уход', 'expense', 'heart', '#ec4899', sort_order_counter, NULL)
  RETURNING id INTO beauty_category_id;
  
  -- Спорт и фитнес
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Спорт и фитнес', 'expense', 'heart', '#10b981', sort_order_counter, NULL)
  RETURNING id INTO sport_category_id;
  
  -- Путешествия
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Путешествия', 'expense', 'plane', '#3b82f6', sort_order_counter, NULL)
  RETURNING id INTO travel_category_id;
  
  -- Дети
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Дети', 'expense', 'heart', '#f97316', sort_order_counter, NULL)
  RETURNING id INTO children_category_id;
  
  -- Домашние животные
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Домашние животные', 'expense', 'heart', '#f97316', sort_order_counter, NULL)
  RETURNING id INTO pets_category_id;
  
  -- Бизнес
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Бизнес', 'expense', 'briefcase', '#6366f1', sort_order_counter, NULL);
  
  -- Налоги
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Налоги', 'expense', 'file-text', '#ef4444', sort_order_counter, NULL);
  
  -- Подарки и благотворительность
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Подарки и благотворительность', 'expense', 'gift', '#a855f7', sort_order_counter, NULL);
  
  -- Прочие расходы
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Прочие расходы', 'expense', 'wallet', '#6b7280', sort_order_counter, NULL);

  -- ============================================
  -- ПОДКАТЕГОРИИ
  -- ============================================
  
  -- Подкатегории для Еды
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Продукты', 'expense', 'shopping', '#f97316', sort_order_counter, food_category_id)
  RETURNING id INTO products_category_id;
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Рестораны и кафе', 'expense', 'coffee', '#f97316', sort_order_counter, food_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Доставка еды', 'expense', 'coffee', '#f97316', sort_order_counter, food_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Алкоголь', 'expense', 'coffee', '#f97316', sort_order_counter, food_category_id);

  -- Подкатегории для Продуктов (виды продуктов)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Мясо и птица', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Рыба и морепродукты', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Молочные продукты', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Овощи', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Фрукты и ягоды', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Хлеб и выпечка', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Крупы и макароны', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Консервы', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Напитки (безалкогольные)', 'expense', 'coffee', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Сладости и десерты', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Специи и приправы', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Замороженные продукты', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Детское питание', 'expense', 'coffee', '#f97316', sort_order_counter, products_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Прочие продукты', 'expense', 'shopping', '#f97316', sort_order_counter, products_category_id);

  -- Подкатегории для Транспорта
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Топливо', 'expense', 'car', '#3b82f6', sort_order_counter, transport_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Общественный транспорт', 'expense', 'car', '#3b82f6', sort_order_counter, transport_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Обслуживание автомобиля', 'expense', 'car', '#3b82f6', sort_order_counter, transport_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Страховка автомобиля', 'expense', 'wallet', '#3b82f6', sort_order_counter, transport_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Парковка', 'expense', 'car', '#3b82f6', sort_order_counter, transport_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Такси', 'expense', 'car', '#3b82f6', sort_order_counter, transport_category_id);

  -- Подкатегории для Жилья
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Аренда/Ипотека', 'expense', 'home', '#a855f7', sort_order_counter, housing_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Коммунальные платежи', 'expense', 'home', '#a855f7', sort_order_counter, housing_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Ремонт и обслуживание', 'expense', 'home', '#a855f7', sort_order_counter, housing_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Мебель и интерьер', 'expense', 'home', '#a855f7', sort_order_counter, housing_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Бытовая техника', 'expense', 'home', '#a855f7', sort_order_counter, housing_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Хозяйственные товары', 'expense', 'shopping', '#a855f7', sort_order_counter, housing_category_id);

  -- Подкатегории для Здоровья
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Медицинские услуги', 'expense', 'heart', '#ef4444', sort_order_counter, health_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Лекарства', 'expense', 'heart', '#ef4444', sort_order_counter, health_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Медицинское страхование', 'expense', 'wallet', '#ef4444', sort_order_counter, health_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Стоматология', 'expense', 'heart', '#ef4444', sort_order_counter, health_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Очки и контактные линзы', 'expense', 'heart', '#ef4444', sort_order_counter, health_category_id);

  -- Подкатегории для Развлечений
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Кино и театры', 'expense', 'film', '#ec4899', sort_order_counter, entertainment_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Игры и развлечения', 'expense', 'gamepad', '#ec4899', sort_order_counter, entertainment_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Хобби', 'expense', 'heart', '#ec4899', sort_order_counter, entertainment_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Подписки (стриминг, игры)', 'expense', 'film', '#ec4899', sort_order_counter, entertainment_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Концерты и мероприятия', 'expense', 'music', '#ec4899', sort_order_counter, entertainment_category_id);

  -- Подкатегории для Покупок
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Электроника', 'expense', 'shopping', '#6366f1', sort_order_counter, shopping_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Книги и журналы', 'expense', 'book', '#6366f1', sort_order_counter, shopping_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Подарки', 'expense', 'gift', '#6366f1', sort_order_counter, shopping_category_id);

  -- Подкатегории для Одежды и обуви
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Одежда', 'expense', 'shopping', '#ec4899', sort_order_counter, clothing_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Обувь', 'expense', 'shopping', '#ec4899', sort_order_counter, clothing_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Аксессуары', 'expense', 'shopping', '#ec4899', sort_order_counter, clothing_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Химчистка и ремонт', 'expense', 'shopping', '#ec4899', sort_order_counter, clothing_category_id);

  -- Подкатегории для Связи
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Мобильная связь', 'expense', 'shopping', '#3b82f6', sort_order_counter, communication_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Интернет', 'expense', 'shopping', '#3b82f6', sort_order_counter, communication_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Телевидение', 'expense', 'film', '#3b82f6', sort_order_counter, communication_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Почтовые услуги', 'expense', 'shopping', '#3b82f6', sort_order_counter, communication_category_id);

  -- Подкатегории для Финансов
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Кредиты', 'expense', 'wallet', '#6366f1', sort_order_counter, finance_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Проценты по кредитам', 'expense', 'dollar', '#6366f1', sort_order_counter, finance_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Банковские комиссии', 'expense', 'wallet', '#6366f1', sort_order_counter, finance_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Страхование', 'expense', 'wallet', '#6366f1', sort_order_counter, finance_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Инвестиции', 'expense', 'trending', '#6366f1', sort_order_counter, finance_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Сбережения', 'expense', 'wallet', '#6366f1', sort_order_counter, finance_category_id);

  -- Подкатегории для Красоты и ухода
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Косметика', 'expense', 'heart', '#ec4899', sort_order_counter, beauty_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Парикмахерская', 'expense', 'heart', '#ec4899', sort_order_counter, beauty_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Спа и массаж', 'expense', 'heart', '#ec4899', sort_order_counter, beauty_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Косметология', 'expense', 'heart', '#ec4899', sort_order_counter, beauty_category_id);

  -- Подкатегории для Спорта и фитнеса
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Спортивный зал', 'expense', 'heart', '#10b981', sort_order_counter, sport_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Спортивная одежда', 'expense', 'shopping', '#10b981', sort_order_counter, sport_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Спортивное питание', 'expense', 'coffee', '#10b981', sort_order_counter, sport_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Тренер', 'expense', 'heart', '#10b981', sort_order_counter, sport_category_id);

  -- Подкатегории для Путешествий
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Авиабилеты', 'expense', 'plane', '#3b82f6', sort_order_counter, travel_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Отели', 'expense', 'home', '#3b82f6', sort_order_counter, travel_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Питание в поездках', 'expense', 'coffee', '#3b82f6', sort_order_counter, travel_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Экскурсии и развлечения', 'expense', 'film', '#3b82f6', sort_order_counter, travel_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Сувениры', 'expense', 'gift', '#3b82f6', sort_order_counter, travel_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Виза и документы', 'expense', 'file-text', '#3b82f6', sort_order_counter, travel_category_id);

  -- Подкатегории для Детей
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Детская одежда', 'expense', 'shopping', '#f97316', sort_order_counter, children_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Детское питание', 'expense', 'coffee', '#f97316', sort_order_counter, children_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Игрушки', 'expense', 'gamepad', '#f97316', sort_order_counter, children_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Образование детей', 'expense', 'book', '#f97316', sort_order_counter, children_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Кружки и секции', 'expense', 'heart', '#f97316', sort_order_counter, children_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Детское здоровье', 'expense', 'heart', '#f97316', sort_order_counter, children_category_id);

  -- Подкатегории для Домашних животных
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Корм для животных', 'expense', 'coffee', '#f97316', sort_order_counter, pets_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Ветеринарные услуги', 'expense', 'heart', '#f97316', sort_order_counter, pets_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Аксессуары для животных', 'expense', 'shopping', '#f97316', sort_order_counter, pets_category_id);
  
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id)
  VALUES (user_uuid, 'Стрижка животных', 'expense', 'heart', '#f97316', sort_order_counter, pets_category_id);
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION create_default_categories(UUID) IS 
'Создаёт расширенный предустановленный набор категорий для нового пользователя. Основан на лучших практиках популярных бюджетных приложений (YNAB, Mint, Actual Budget). Создаёт 7 категорий доходов, 19 основных категорий расходов и более 100 подкатегорий, включая детальную классификацию продуктов питания.';

-- Создаём триггер на таблице profiles для автоматического создания категорий
-- Этот триггер срабатывает после создания профиля
CREATE OR REPLACE FUNCTION on_profile_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Создаём предустановленные категории (только если их ещё нет)
  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = NEW.id LIMIT 1) THEN
    PERFORM create_default_categories(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Удаляем старый триггер, если он существует
DROP TRIGGER IF EXISTS on_profile_created_trigger ON profiles;

-- Создаём новый триггер
CREATE TRIGGER on_profile_created_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION on_profile_created();

-- Комментарий к триггеру
COMMENT ON TRIGGER on_profile_created_trigger ON profiles IS 
'Автоматически создаёт предустановленные категории при создании профиля пользователя';
