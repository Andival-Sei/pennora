-- Миграция: Разделение категории "Фрукты и ягоды" и добавление подкатегории "Туалетная бумага"
--
-- Эта миграция:
-- 1. Разделяет категорию "Фрукты и ягоды" на две отдельные категории: "Фрукты" и "Ягоды"
-- 2. Добавляет подкатегорию "Туалетная бумага" в категорию "Хозяйственные товары"
-- 3. Обновляет функцию create_default_categories для новых пользователей
-- 4. Обновляет существующие категории для уже созданных пользователей

-- Функция для обновления существующих категорий
CREATE OR REPLACE FUNCTION update_fruits_berries_and_toilet_paper_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fruits_berries_category_id UUID;
  products_category_id UUID;
  household_category_id UUID;
  user_record RECORD;
  current_sort_order INTEGER;
  fruits_category_id UUID;
  berries_category_id UUID;
BEGIN
  -- Для каждого пользователя
  FOR user_record IN SELECT DISTINCT user_id FROM categories LOOP
    -- Находим категорию "Фрукты и ягоды" для этого пользователя
    SELECT c.id, c.parent_id, c.sort_order
    INTO fruits_berries_category_id, products_category_id, current_sort_order
    FROM categories c
    WHERE c.name = 'Фрукты и ягоды'
      AND c.user_id = user_record.user_id
      AND c.parent_id IS NOT NULL
    LIMIT 1;

    -- Если категория "Фрукты и ягоды" найдена и products_category_id корректный
    IF fruits_berries_category_id IS NOT NULL AND products_category_id IS NOT NULL THEN
      -- Создаём категорию "Фрукты" с тем же sort_order
      INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
      VALUES (user_record.user_id, 'Фрукты', 'expense', 'package', NULL, current_sort_order, products_category_id, true)
      RETURNING id INTO fruits_category_id;

      -- Создаём категорию "Ягоды" со следующим sort_order
      INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
      VALUES (user_record.user_id, 'Ягоды', 'expense', 'package', NULL, current_sort_order + 1, products_category_id, true)
      RETURNING id INTO berries_category_id;

      -- Обновляем транзакции, которые ссылаются на "Фрукты и ягоды", на "Фрукты"
      -- (если fruits_category_id успешно создан)
      IF fruits_category_id IS NOT NULL THEN
        UPDATE transactions
        SET category_id = fruits_category_id
        WHERE category_id = fruits_berries_category_id
          AND user_id = user_record.user_id;
      END IF;

      -- Удаляем старую категорию "Фрукты и ягоды"
      DELETE FROM categories
      WHERE id = fruits_berries_category_id;
    END IF;

    -- Находим категорию "Хозяйственные товары" для этого пользователя
    SELECT c.id INTO household_category_id
    FROM categories c
    WHERE c.name = 'Хозяйственные товары'
      AND c.user_id = user_record.user_id
      AND c.parent_id IN (
        SELECT id FROM categories
        WHERE name = 'Жильё'
          AND user_id = user_record.user_id
          AND parent_id IS NULL
      )
    LIMIT 1;

    -- Если категория "Хозяйственные товары" найдена
    IF household_category_id IS NOT NULL THEN
      -- Проверяем, не существует ли уже подкатегория "Туалетная бумага"
      IF NOT EXISTS (
        SELECT 1 FROM categories
        WHERE name = 'Туалетная бумага'
          AND user_id = user_record.user_id
          AND parent_id = household_category_id
      ) THEN
        -- Получаем максимальный sort_order среди подкатегорий "Хозяйственные товары"
        SELECT COALESCE(MAX(sort_order), 0) + 1 INTO current_sort_order
        FROM categories
        WHERE parent_id = household_category_id;

        -- Создаём подкатегорию "Туалетная бумага"
        INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
        VALUES (user_record.user_id, 'Туалетная бумага', 'expense', 'package', NULL, current_sort_order, household_category_id, true);
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Обновляем функцию create_default_categories
CREATE OR REPLACE FUNCTION create_default_categories(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sort_order_counter INTEGER := 0;
  -- Доходы
  salary_category_id UUID;
  bonus_category_id UUID;
  investment_category_id UUID;
  rental_category_id UUID;
  dividends_category_id UUID;
  gifts_income_category_id UUID;
  other_income_category_id UUID;
  -- Подкатегории доходов
  stocks_category_id UUID;
  bonds_category_id UUID;
  crypto_category_id UUID;
  real_estate_rental_category_id UUID;
  -- Расходы - основные категории
  food_category_id UUID;
  transport_category_id UUID;
  housing_category_id UUID;
  health_category_id UUID;
  entertainment_category_id UUID;
  education_category_id UUID;
  shopping_category_id UUID;
  clothing_category_id UUID;
  communication_category_id UUID;
  finance_category_id UUID;
  beauty_category_id UUID;
  sport_category_id UUID;
  travel_category_id UUID;
  children_category_id UUID;
  pets_category_id UUID;
  business_category_id UUID;
  taxes_category_id UUID;
  gifts_charity_category_id UUID;
  other_expense_category_id UUID;
  -- Подкатегории расходов
  products_category_id UUID;
  restaurants_category_id UUID;
  delivery_category_id UUID;
  alcohol_category_id UUID;
  fuel_category_id UUID;
  public_transport_category_id UUID;
  car_service_category_id UUID;
  car_insurance_category_id UUID;
  parking_category_id UUID;
  taxi_category_id UUID;
  rent_mortgage_category_id UUID;
  utilities_category_id UUID;
  repair_category_id UUID;
  furniture_category_id UUID;
  appliances_category_id UUID;
  household_category_id UUID;
  medical_services_category_id UUID;
  medicines_category_id UUID;
  health_insurance_category_id UUID;
  dentistry_category_id UUID;
  glasses_category_id UUID;
  cinema_category_id UUID;
  games_category_id UUID;
  hobbies_category_id UUID;
  subscriptions_category_id UUID;
  concerts_category_id UUID;
  electronics_category_id UUID;
  books_magazines_category_id UUID;
  gifts_shopping_category_id UUID;
  clothes_category_id UUID;
  shoes_category_id UUID;
  accessories_category_id UUID;
  cleaning_category_id UUID;
  mobile_category_id UUID;
  internet_category_id UUID;
  tv_category_id UUID;
  postal_category_id UUID;
  loans_category_id UUID;
  interest_category_id UUID;
  bank_fees_category_id UUID;
  insurance_category_id UUID;
  investments_expense_category_id UUID;
  savings_category_id UUID;
  cosmetics_category_id UUID;
  hairdresser_category_id UUID;
  spa_category_id UUID;
  cosmetology_category_id UUID;
  gym_category_id UUID;
  sportswear_category_id UUID;
  sports_nutrition_category_id UUID;
  trainer_category_id UUID;
  flights_category_id UUID;
  hotels_category_id UUID;
  travel_food_category_id UUID;
  travel_entertainment_category_id UUID;
  souvenirs_category_id UUID;
  visa_category_id UUID;
  children_clothes_category_id UUID;
  children_food_category_id UUID;
  toys_category_id UUID;
  children_education_category_id UUID;
  children_sections_category_id UUID;
  children_health_category_id UUID;
  pet_food_category_id UUID;
  vet_category_id UUID;
  pet_accessories_category_id UUID;
  pet_grooming_category_id UUID;
  -- Подкатегории образования
  courses_category_id UUID;
  online_learning_category_id UUID;
  books_education_category_id UUID;
  -- Подкатегории налогов
  income_tax_category_id UUID;
  property_tax_category_id UUID;
  transport_tax_category_id UUID;
  -- Подкатегории бизнеса
  office_category_id UUID;
  advertising_category_id UUID;
  equipment_category_id UUID;
BEGIN
  -- ============================================
  -- ДОХОДЫ (Income) - уникальные зелёные оттенки
  -- ===========================================
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Зарплата', 'income', 'briefcase', '#10b981', sort_order_counter, NULL, true)
  RETURNING id INTO salary_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Премии', 'income', 'gift', '#059669', sort_order_counter, NULL, true)
  RETURNING id INTO bonus_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Инвестиции', 'income', 'trending', '#047857', sort_order_counter, NULL, true)
  RETURNING id INTO investment_category_id;

  -- Подкатегории для Инвестиций
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Акции', 'income', 'trending', NULL, sort_order_counter, investment_category_id, true)
  RETURNING id INTO stocks_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Облигации', 'income', 'trending', NULL, sort_order_counter, investment_category_id, true)
  RETURNING id INTO bonds_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Криптовалюты', 'income', 'trending', NULL, sort_order_counter, investment_category_id, true)
  RETURNING id INTO crypto_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Аренда недвижимости', 'income', 'home', '#065f46', sort_order_counter, NULL, true)
  RETURNING id INTO rental_category_id;

  -- Подкатегории для Аренды недвижимости
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Аренда квартиры', 'income', 'home', NULL, sort_order_counter, rental_category_id, true)
  RETURNING id INTO real_estate_rental_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Аренда коммерческой недвижимости', 'income', 'building', NULL, sort_order_counter, rental_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Дивиденды', 'income', 'dollar', '#047857', sort_order_counter, NULL, true)
  RETURNING id INTO dividends_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Подарки', 'income', 'gift', '#059669', sort_order_counter, NULL, true)
  RETURNING id INTO gifts_income_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Прочие доходы', 'income', 'wallet', '#10b981', sort_order_counter, NULL, true)
  RETURNING id INTO other_income_category_id;

  -- ============================================
  -- РАСХОДЫ (Expense) - уникальные цвета для каждой верхней категории
  -- ===========================================

  -- Еда (#ef4444 - красный)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Еда', 'expense', 'food', '#ef4444', sort_order_counter, NULL, true)
  RETURNING id INTO food_category_id;

  -- Транспорт (#3b82f6 - синий)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Транспорт', 'expense', 'car', '#3b82f6', sort_order_counter, NULL, true)
  RETURNING id INTO transport_category_id;

  -- Жильё (#a855f7 - фиолетовый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Жильё', 'expense', 'home', '#a855f7', sort_order_counter, NULL, true)
  RETURNING id INTO housing_category_id;

  -- Здоровье (#f43f5e - розово-красный)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Здоровье', 'expense', 'heart-pulse', '#f43f5e', sort_order_counter, NULL, true)
  RETURNING id INTO health_category_id;

  -- Развлечения (#ec4899 - розовый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Развлечения', 'expense', 'film', '#ec4899', sort_order_counter, NULL, true)
  RETURNING id INTO entertainment_category_id;

  -- Образование (#6366f1 - индиго)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Образование', 'expense', 'graduation-cap', '#6366f1', sort_order_counter, NULL, true)
  RETURNING id INTO education_category_id;

  -- Покупки (#8b5cf6 - фиолетовый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Покупки', 'expense', 'shopping-bag', '#8b5cf6', sort_order_counter, NULL, true)
  RETURNING id INTO shopping_category_id;

  -- Одежда и обувь (#ec4899 - розовый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Одежда и обувь', 'expense', 'shirt', '#ec4899', sort_order_counter, NULL, true)
  RETURNING id INTO clothing_category_id;

  -- Связь (#06b6d4 - бирюзовый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Связь', 'expense', 'phone', '#06b6d4', sort_order_counter, NULL, true)
  RETURNING id INTO communication_category_id;

  -- Финансы (#6366f1 - индиго)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Финансы', 'expense', 'credit-card', '#6366f1', sort_order_counter, NULL, true)
  RETURNING id INTO finance_category_id;

  -- Красота и уход (#f472b6 - розовый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Красота и уход', 'expense', 'sparkles', '#f472b6', sort_order_counter, NULL, true)
  RETURNING id INTO beauty_category_id;

  -- Спорт и фитнес (#10b981 - зелёный)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Спорт и фитнес', 'expense', 'dumbbell', '#10b981', sort_order_counter, NULL, true)
  RETURNING id INTO sport_category_id;

  -- Путешествия (#3b82f6 - синий)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Путешествия', 'expense', 'plane', '#3b82f6', sort_order_counter, NULL, true)
  RETURNING id INTO travel_category_id;

  -- Дети (#f97316 - оранжевый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Дети', 'expense', 'baby', '#f97316', sort_order_counter, NULL, true)
  RETURNING id INTO children_category_id;

  -- Домашние животные (#f97316 - оранжевый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Домашние животные', 'expense', 'dog', '#f97316', sort_order_counter, NULL, true)
  RETURNING id INTO pets_category_id;

  -- Бизнес (#6366f1 - индиго)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Бизнес', 'expense', 'briefcase', '#6366f1', sort_order_counter, NULL, true)
  RETURNING id INTO business_category_id;

  -- Налоги (#dc2626 - тёмно-красный)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Налоги', 'expense', 'file-text', '#dc2626', sort_order_counter, NULL, true)
  RETURNING id INTO taxes_category_id;

  -- Подарки и благотворительность (#a855f7 - фиолетовый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Подарки и благотворительность', 'expense', 'gift', '#a855f7', sort_order_counter, NULL, true)
  RETURNING id INTO gifts_charity_category_id;

  -- Прочие расходы (#6b7280 - серый)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Прочие расходы', 'expense', 'wallet', '#6b7280', sort_order_counter, NULL, true)
  RETURNING id INTO other_expense_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ЕДЫ (color = NULL - наследуют от родителя)
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Продукты', 'expense', 'shopping-bag', NULL, sort_order_counter, food_category_id, true)
  RETURNING id INTO products_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Рестораны и кафе', 'expense', 'utensils', NULL, sort_order_counter, food_category_id, true)
  RETURNING id INTO restaurants_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Доставка еды', 'expense', 'package', NULL, sort_order_counter, food_category_id, true)
  RETURNING id INTO delivery_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Готовая еда', 'expense', 'utensils-crossed', NULL, sort_order_counter, food_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Алкоголь', 'expense', 'droplet', NULL, sort_order_counter, food_category_id, true)
  RETURNING id INTO alcohol_category_id;

  -- Под-подкатегории для Продуктов (детализация)
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Мясо и птица', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Рыба и морепродукты', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Молочные продукты', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Овощи', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  -- ИЗМЕНЕНИЕ: Разделяем "Фрукты и ягоды" на две категории
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Фрукты', 'expense', 'apple', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Ягоды', 'expense', 'cherry', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Хлеб и выпечка', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Крупы и макароны', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Консервы', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Напитки (безалкогольные)', 'expense', 'coffee', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Сладости и десерты', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Специи и приправы', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Замороженные продукты', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Детское питание', 'expense', 'baby', NULL, sort_order_counter, products_category_id, true);

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Прочие продукты', 'expense', 'shopping', NULL, sort_order_counter, products_category_id, true);

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ТРАНСПОРТА
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Топливо', 'expense', 'fuel', NULL, sort_order_counter, transport_category_id, true)
  RETURNING id INTO fuel_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Общественный транспорт', 'expense', 'bus', NULL, sort_order_counter, transport_category_id, true)
  RETURNING id INTO public_transport_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Обслуживание автомобиля', 'expense', 'car-front', NULL, sort_order_counter, transport_category_id, true)
  RETURNING id INTO car_service_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Страховка автомобиля', 'expense', 'credit-card', NULL, sort_order_counter, transport_category_id, true)
  RETURNING id INTO car_insurance_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Парковка', 'expense', 'map-pin', NULL, sort_order_counter, transport_category_id, true)
  RETURNING id INTO parking_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Такси', 'expense', 'car', NULL, sort_order_counter, transport_category_id, true)
  RETURNING id INTO taxi_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ЖИЛЬЯ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Аренда/Ипотека', 'expense', 'home', NULL, sort_order_counter, housing_category_id, true)
  RETURNING id INTO rent_mortgage_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Коммунальные платежи', 'expense', 'home', NULL, sort_order_counter, housing_category_id, true)
  RETURNING id INTO utilities_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Ремонт и обслуживание', 'expense', 'home', NULL, sort_order_counter, housing_category_id, true)
  RETURNING id INTO repair_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Мебель и интерьер', 'expense', 'home', NULL, sort_order_counter, housing_category_id, true)
  RETURNING id INTO furniture_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Бытовая техника', 'expense', 'box', NULL, sort_order_counter, housing_category_id, true)
  RETURNING id INTO appliances_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Хозяйственные товары', 'expense', 'box', NULL, sort_order_counter, housing_category_id, true)
  RETURNING id INTO household_category_id;

  -- ИЗМЕНЕНИЕ: Добавляем подкатегорию "Туалетная бумага" под "Хозяйственные товары"
  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Туалетная бумага', 'expense', 'box', NULL, sort_order_counter, household_category_id, true);

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ЗДОРОВЬЯ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Медицинские услуги', 'expense', 'stethoscope', NULL, sort_order_counter, health_category_id, true)
  RETURNING id INTO medical_services_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Лекарства', 'expense', 'pill', NULL, sort_order_counter, health_category_id, true)
  RETURNING id INTO medicines_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Медицинское страхование', 'expense', 'credit-card', NULL, sort_order_counter, health_category_id, true)
  RETURNING id INTO health_insurance_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Стоматология', 'expense', 'stethoscope', NULL, sort_order_counter, health_category_id, true)
  RETURNING id INTO dentistry_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Очки и контактные линзы', 'expense', 'eye', NULL, sort_order_counter, health_category_id, true)
  RETURNING id INTO glasses_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ РАЗВЛЕЧЕНИЙ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Кино и театры', 'expense', 'film', NULL, sort_order_counter, entertainment_category_id, true)
  RETURNING id INTO cinema_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Игры и развлечения', 'expense', 'gamepad', NULL, sort_order_counter, entertainment_category_id, true)
  RETURNING id INTO games_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Хобби', 'expense', 'palette', NULL, sort_order_counter, entertainment_category_id, true)
  RETURNING id INTO hobbies_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Подписки (стриминг, игры)', 'expense', 'film', NULL, sort_order_counter, entertainment_category_id, true)
  RETURNING id INTO subscriptions_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Концерты и мероприятия', 'expense', 'music', NULL, sort_order_counter, entertainment_category_id, true)
  RETURNING id INTO concerts_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ОБРАЗОВАНИЯ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Курсы и обучение', 'expense', 'graduation-cap', NULL, sort_order_counter, education_category_id, true)
  RETURNING id INTO courses_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Онлайн-обучение', 'expense', 'laptop', NULL, sort_order_counter, education_category_id, true)
  RETURNING id INTO online_learning_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Книги и учебные материалы', 'expense', 'book', NULL, sort_order_counter, education_category_id, true)
  RETURNING id INTO books_education_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ПОКУПОК
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Электроника', 'expense', 'smartphone', NULL, sort_order_counter, shopping_category_id, true)
  RETURNING id INTO electronics_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Книги и журналы', 'expense', 'book', NULL, sort_order_counter, shopping_category_id, true)
  RETURNING id INTO books_magazines_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Подарки', 'expense', 'gift', NULL, sort_order_counter, shopping_category_id, true)
  RETURNING id INTO gifts_shopping_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ОДЕЖДЫ И ОБУВИ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Одежда', 'expense', 'shirt', NULL, sort_order_counter, clothing_category_id, true)
  RETURNING id INTO clothes_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Обувь', 'expense', 'footprints', NULL, sort_order_counter, clothing_category_id, true)
  RETURNING id INTO shoes_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Аксессуары', 'expense', 'star', NULL, sort_order_counter, clothing_category_id, true)
  RETURNING id INTO accessories_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Химчистка и ремонт', 'expense', 'scissors', NULL, sort_order_counter, clothing_category_id, true)
  RETURNING id INTO cleaning_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ СВЯЗИ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Мобильная связь', 'expense', 'smartphone', NULL, sort_order_counter, communication_category_id, true)
  RETURNING id INTO mobile_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Интернет', 'expense', 'wifi', NULL, sort_order_counter, communication_category_id, true)
  RETURNING id INTO internet_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Телевидение', 'expense', 'film', NULL, sort_order_counter, communication_category_id, true)
  RETURNING id INTO tv_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Почтовые услуги', 'expense', 'mail', NULL, sort_order_counter, communication_category_id, true)
  RETURNING id INTO postal_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ФИНАНСОВ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Кредиты', 'expense', 'credit-card', NULL, sort_order_counter, finance_category_id, true)
  RETURNING id INTO loans_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Проценты по кредитам', 'expense', 'dollar', NULL, sort_order_counter, finance_category_id, true)
  RETURNING id INTO interest_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Банковские комиссии', 'expense', 'credit-card', NULL, sort_order_counter, finance_category_id, true)
  RETURNING id INTO bank_fees_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Страхование', 'expense', 'credit-card', NULL, sort_order_counter, finance_category_id, true)
  RETURNING id INTO insurance_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Инвестиции', 'expense', 'trending', NULL, sort_order_counter, finance_category_id, true)
  RETURNING id INTO investments_expense_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Сбережения', 'expense', 'wallet', NULL, sort_order_counter, finance_category_id, true)
  RETURNING id INTO savings_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ КРАСОТЫ И УХОДА
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Косметика', 'expense', 'sparkles', NULL, sort_order_counter, beauty_category_id, true)
  RETURNING id INTO cosmetics_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Парикмахерская', 'expense', 'scissors', NULL, sort_order_counter, beauty_category_id, true)
  RETURNING id INTO hairdresser_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Спа и массаж', 'expense', 'droplet', NULL, sort_order_counter, beauty_category_id, true)
  RETURNING id INTO spa_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Косметология', 'expense', 'scissors', NULL, sort_order_counter, beauty_category_id, true)
  RETURNING id INTO cosmetology_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ СПОРТА И ФИТНЕСА
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Спортивный зал', 'expense', 'dumbbell', NULL, sort_order_counter, sport_category_id, true)
  RETURNING id INTO gym_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Спортивная одежда', 'expense', 'shirt', NULL, sort_order_counter, sport_category_id, true)
  RETURNING id INTO sportswear_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Спортивное питание', 'expense', 'coffee', NULL, sort_order_counter, sport_category_id, true)
  RETURNING id INTO sports_nutrition_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Тренер', 'expense', 'heart-pulse', NULL, sort_order_counter, sport_category_id, true)
  RETURNING id INTO trainer_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ПУТЕШЕСТВИЙ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Авиабилеты', 'expense', 'plane', NULL, sort_order_counter, travel_category_id, true)
  RETURNING id INTO flights_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Отели', 'expense', 'home', NULL, sort_order_counter, travel_category_id, true)
  RETURNING id INTO hotels_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Питание в поездках', 'expense', 'utensils', NULL, sort_order_counter, travel_category_id, true)
  RETURNING id INTO travel_food_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Экскурсии и развлечения', 'expense', 'camera', NULL, sort_order_counter, travel_category_id, true)
  RETURNING id INTO travel_entertainment_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Сувениры', 'expense', 'gift', NULL, sort_order_counter, travel_category_id, true)
  RETURNING id INTO souvenirs_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Виза и документы', 'expense', 'file-text', NULL, sort_order_counter, travel_category_id, true)
  RETURNING id INTO visa_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ДЕТЕЙ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Детская одежда', 'expense', 'shirt', NULL, sort_order_counter, children_category_id, true)
  RETURNING id INTO children_clothes_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Детское питание', 'expense', 'baby', NULL, sort_order_counter, children_category_id, true)
  RETURNING id INTO children_food_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Игрушки', 'expense', 'gamepad', NULL, sort_order_counter, children_category_id, true)
  RETURNING id INTO toys_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Образование детей', 'expense', 'graduation-cap', NULL, sort_order_counter, children_category_id, true)
  RETURNING id INTO children_education_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Кружки и секции', 'expense', 'trophy', NULL, sort_order_counter, children_category_id, true)
  RETURNING id INTO children_sections_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Детское здоровье', 'expense', 'heart-pulse', NULL, sort_order_counter, children_category_id, true)
  RETURNING id INTO children_health_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ ДОМАШНИХ ЖИВОТНЫХ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Корм для животных', 'expense', 'package', NULL, sort_order_counter, pets_category_id, true)
  RETURNING id INTO pet_food_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Ветеринарные услуги', 'expense', 'stethoscope', NULL, sort_order_counter, pets_category_id, true)
  RETURNING id INTO vet_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Аксессуары для животных', 'expense', 'star', NULL, sort_order_counter, pets_category_id, true)
  RETURNING id INTO pet_accessories_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Стрижка животных', 'expense', 'scissors', NULL, sort_order_counter, pets_category_id, true)
  RETURNING id INTO pet_grooming_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ НАЛОГОВ
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Подоходный налог', 'expense', 'file-text', NULL, sort_order_counter, taxes_category_id, true)
  RETURNING id INTO income_tax_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Имущественный налог', 'expense', 'file-text', NULL, sort_order_counter, taxes_category_id, true)
  RETURNING id INTO property_tax_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Транспортный налог', 'expense', 'file-text', NULL, sort_order_counter, taxes_category_id, true)
  RETURNING id INTO transport_tax_category_id;

  -- ============================================
  -- ПОДКАТЕГОРИИ ДЛЯ БИЗНЕСА
  -- ============================================

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Офис', 'expense', 'building', NULL, sort_order_counter, business_category_id, true)
  RETURNING id INTO office_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Реклама и маркетинг', 'expense', 'star', NULL, sort_order_counter, business_category_id, true)
  RETURNING id INTO advertising_category_id;

  sort_order_counter := sort_order_counter + 1;
  INSERT INTO categories (user_id, name, type, icon, color, sort_order, parent_id, is_system)
  VALUES (user_uuid, 'Оборудование', 'expense', 'box', NULL, sort_order_counter, business_category_id, true)
  RETURNING id INTO equipment_category_id;

END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION create_default_categories(UUID) IS
'Создаёт расширенный предустановленный набор категорий для нового пользователя. Включает разделённые категории "Фрукты" и "Ягоды", а также подкатегорию "Туалетная бумага" в "Хозяйственные товары".';

-- Комментарий к функции обновления
COMMENT ON FUNCTION update_fruits_berries_and_toilet_paper_categories() IS
'Обновляет существующие категории: разделяет "Фрукты и ягоды" на две категории и добавляет подкатегорию "Туалетная бумага" в "Хозяйственные товары".';

-- Применяем обновление к существующим категориям
SELECT update_fruits_berries_and_toilet_paper_categories();
