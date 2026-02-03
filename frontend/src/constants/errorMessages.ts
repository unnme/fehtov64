/**
 * Russian translations for API error codes.
 * Keys must match ErrorCode values from backend/app/core/errors/codes.py
 */
export const errorMessages: Record<string, string> = {
  // Positions
  POSITION_EXISTS: "Должность с таким названием уже существует",
  POSITION_NOT_FOUND: "Должность не найдена",
  POSITION_DEFAULT_PROTECTED: "Системная должность защищена от изменений",

  // Persons
  PERSON_EXISTS: "Сотрудник с таким именем уже существует",
  PERSON_NOT_FOUND: "Сотрудник не найден",
  PERSON_PHONE_EXISTS: "Этот номер телефона уже используется",
  PERSON_EMAIL_EXISTS: "Этот email уже используется",

  // Person Images
  PERSON_IMAGE_NOT_FOUND: "Фотография сотрудника не найдена",

  // News
  NEWS_NOT_FOUND: "Новость не найдена",
  NEWS_FORBIDDEN: "Недостаточно прав для этого действия",
  NEWS_OWNER_NOT_FOUND: "Автор не найден",
  NEWS_OWNER_CHANGE_FORBIDDEN: "Только администраторы могут менять автора новости",

  // News Images
  NEWS_IMAGE_NOT_FOUND: "Изображение не найдено",
  NEWS_IMAGE_INVALID_ORDER: "Неверный порядок изображения",

  // Documents
  DOCUMENT_NOT_FOUND: "Документ не найден",
  DOCUMENT_FILE_NOT_FOUND: "Файл документа не найден",
  DOCUMENT_FORBIDDEN: "Недостаточно прав для этого действия",

  // Document Categories
  CATEGORY_NOT_FOUND: "Категория не найдена",
  CATEGORY_EXISTS: "Категория с таким названием уже существует",
  CATEGORY_FORBIDDEN: "Недостаточно прав для этого действия",
  CATEGORY_INVALID_ID: "Неверный формат ID категории",

  // Organization Card
  ORG_CARD_NOT_FOUND: "Карточка организации не найдена",
  ORG_CARD_EXISTS: "Карточка организации уже существует",

  // Auth
  AUTH_INVALID_CREDENTIALS: "Неверный email или пароль",
  AUTH_INACTIVE_USER: "Ваш аккаунт неактивен",
  AUTH_INVALID_TOKEN: "Недействительный токен",
  AUTH_USER_NOT_FOUND: "Пользователь не найден",

  // Users
  USER_NOT_FOUND: "Пользователь не найден",
  USER_EMAIL_EXISTS: "Пользователь с таким email уже существует",
  USER_NAME_EXISTS: "Пользователь с таким именем уже существует",
  USER_SUPERUSER_REQUIRED: "Только администраторы могут выполнить это действие",
  USER_EMAIL_CHANGE_FORBIDDEN: "Email нельзя изменить через этот интерфейс",
  USER_EMAIL_SAME: "Это уже ваш текущий email",
  USER_EMAIL_NOT_SET: "Email не установлен",
  USER_VERIFICATION_INVALID: "Неверный или просроченный код подтверждения",
  USER_PASSWORD_INCORRECT: "Неверный текущий пароль",
  USER_PASSWORD_SAME: "Новый пароль должен отличаться от текущего",
  USER_DELETE_FIRST_SUPERUSER: "Системный аккаунт администратора нельзя удалить",
  USER_DELETE_GUARDIAN: "Системный аккаунт Guardian нельзя удалить",
  USER_GUARDIAN_NOT_FOUND: "Системный пользователь Guardian не найден",
  USER_INSUFFICIENT_PRIVILEGES: "Недостаточно прав",
  USER_SUPERUSER_SELF_DEMOTE: "Нельзя снять с себя права администратора",
  USER_DELETE_SELF_FORBIDDEN: "Нельзя удалить свой собственный аккаунт",
}
