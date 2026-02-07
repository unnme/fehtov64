"""
Test news and images creation.
"""

import logging
import random
from typing import Any

from sqlmodel import Session, select

from app.core.config import settings
from app.models import News, NewsImage, User
from app.repositories.news_repository import create_news
from app.schemas import NewsCreate

from ..constants import TEST_IMAGE_FILES
from ..utils.image_handler import has_missing_image_files, save_image_from_file

logger = logging.getLogger(__name__)

# Constants for news creation
MIN_NEWS_WITHOUT_IMAGES = 3
IMAGE_PROBABILITY = 0.6  # Probability of adding images to news

NEWS_DATA = [
    {
        "title": "Открыт набор в группу начальной подготовки",
        "content": "Школа фехтования объявляет набор детей от 7 лет в группу начальной подготовки. Занятия проводятся три раза в неделю под руководством опытных тренеров. Первое пробное занятие бесплатно. Запись по телефону или через форму на сайте. Количество мест ограничено.",
    },
    {
        "title": "Наши спортсмены завоевали медали на чемпионате города",
        "content": "Поздравляем воспитанников школы с успешным выступлением на городском чемпионате по фехтованию! Иван Петров занял первое место в категории юниоров, а команда девушек завоевала серебро в командном зачёте. Благодарим тренерский состав за отличную подготовку спортсменов.",
    },
    {
        "title": "Изменение расписания тренировок на летний период",
        "content": "С 1 июня вступает в силу летнее расписание занятий. Утренние тренировки начинаются в 9:00, вечерние — в 18:00. По субботам добавлена дополнительная группа для взрослых. Актуальное расписание доступно в разделе «Расписание» на нашем сайте.",
    },
    {
        "title": "Мастер-класс от чемпиона России",
        "content": "Приглашаем на мастер-класс, который проведёт многократный чемпион России по фехтованию на шпагах. Участники смогут получить ценные советы по технике, тактике и психологической подготовке. Мероприятие состоится в субботу в 14:00. Регистрация обязательна.",
    },
    {
        "title": "Закупка нового тренировочного оборудования",
        "content": "Благодаря поддержке спонсоров школа приобрела современное тренировочное оборудование: электрические фиксаторы уколов, новые дорожки и защитную экипировку. Это позволит повысить качество подготовки спортсменов и проводить соревнования на профессиональном уровне.",
    },
    {
        "title": "Поздравляем Анну Сидорову с присвоением разряда КМС",
        "content": "Воспитанница нашей школы Анна Сидорова выполнила норматив кандидата в мастера спорта по фехтованию на рапирах. Это заслуженный результат многолетних упорных тренировок. Желаем Анне дальнейших спортивных успехов и покорения новых вершин!",
    },
    {
        "title": "Турнир памяти основателя школы",
        "content": "В декабре состоится ежегодный турнир памяти основателя школы фехтования. К участию приглашаются спортсмены всех возрастных категорий. Победители получат кубки и ценные призы. Заявки принимаются до 1 декабря. Подробности у администратора.",
    },
    {
        "title": "Открытая тренировка для родителей",
        "content": "Приглашаем родителей посетить открытую тренировку, которая состоится в пятницу в 17:00. Вы сможете увидеть, как проходят занятия, познакомиться с тренерами и задать интересующие вопросы. После тренировки — чаепитие и обсуждение планов на сезон.",
    },
    {
        "title": "Каникулярная программа для детей",
        "content": "На время школьных каникул подготовлена специальная программа интенсивных тренировок. Ежедневные занятия с 10:00 до 13:00 включают разминку, работу над техникой, спарринги и подвижные игры. Записаться можно по телефону школы или у тренера.",
    },
    {
        "title": "Сборы перед чемпионатом области",
        "content": "Команда школы отправляется на учебно-тренировочные сборы в рамках подготовки к чемпионату области. Сборы пройдут на базе спортивного комплекса с 15 по 25 октября. Участники получат интенсивную подготовку и возможность спаррингов с сильными соперниками.",
    },
    {
        "title": "Новый тренер в нашей команде",
        "content": "Рады представить нового тренера — мастера спорта международного класса Дмитрия Волкова. Дмитрий имеет богатый опыт выступлений на международных соревнованиях и работы с молодыми спортсменами. Он будет вести группы по фехтованию на саблях.",
    },
    {
        "title": "Участие в международном турнире",
        "content": "Сборная школы примет участие в международном юношеском турнире, который пройдёт в Будапеште. Это отличная возможность для наших спортсменов получить опыт международных соревнований и познакомиться с фехтовальщиками из других стран.",
    },
    {
        "title": "Ремонт раздевалок завершён",
        "content": "Завершён капитальный ремонт раздевалок. Установлены новые шкафчики, обновлена сантехника, сделана современная отделка. Теперь наши спортсмены могут готовиться к тренировкам в комфортных условиях. Благодарим всех за терпение во время ремонтных работ.",
    },
    {
        "title": "Онлайн-семинар по правилам соревнований",
        "content": "Для тренеров и спортсменов школы организован онлайн-семинар по актуальным правилам соревнований FIE. Ведущий — судья международной категории. Участие бесплатное, необходима предварительная регистрация. Ссылка для подключения будет отправлена на email.",
    },
    {
        "title": "Фотоотчёт с соревнований опубликован",
        "content": "В разделе «Галерея» опубликован фотоотчёт с прошедших городских соревнований. Более 200 фотографий запечатлели яркие моменты боёв, церемонию награждения и закулисную атмосферу турнира. Благодарим фотографа Елену Михайлову за отличную работу!",
    },
]


def get_superuser(session: Session) -> User | None:
    """Gets the superuser."""
    return session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()


def add_images_to_news(
    session: Session, news_id: Any, news_title: str
) -> None:
    """Adds random images to news."""
    num_images = random.randint(1, 3)
    selected_images = random.sample(
        TEST_IMAGE_FILES, min(num_images, len(TEST_IMAGE_FILES))
    )

    for order, image_file in enumerate(selected_images, start=1):
        save_image_from_file(session, news_id, image_file, order)

    session.commit()
    logger.info(f"Added {len(selected_images)} image(s) to news '{news_title}'")


def create_news_item(
    session: Session,
    superuser: User,
    news_data: dict[str, str],
    index: int,
    news_without_images_count: int,
    min_news_without_images: int,
) -> None:
    """Creates a single news item with optional images."""
    news_title = news_data["title"]

    existing_news = session.exec(
        select(News).where(
            News.title == news_title, News.owner_id == superuser.id
        )
    ).first()

    if existing_news:
        existing_images = session.exec(
            select(NewsImage).where(NewsImage.news_id == existing_news.id)
        ).all()

        if not existing_images or has_missing_image_files(existing_images):
            for image in existing_images:
                session.delete(image)
            session.commit()

            if news_without_images_count >= min_news_without_images:
                add_images_to_news(session, existing_news.id, existing_news.title)

        logger.info(f"News '{news_title}' already exists, skipping")
        return

    is_published = index % 5 != 0  # Every 5th news is unpublished

    news_in = NewsCreate(
        title=news_title,
        content=news_data["content"],
        is_published=is_published,
    )

    news = create_news(
        session=session, news_in=news_in, owner_id=superuser.id
    )
    session.commit()
    session.refresh(news)

    should_add_images = False
    if news_without_images_count < min_news_without_images:
        should_add_images = False
    else:
        should_add_images = random.random() < IMAGE_PROBABILITY

    if should_add_images:
        add_images_to_news(session, news.id, news_in.title)

    logger.info(f"Created news '{news_in.title}' for user {superuser.email}")


def create_test_news(session: Session) -> None:
    """Creates test news for the superuser."""
    if settings.ENVIRONMENT != "local":
        logger.info("Seed news is disabled outside local environment")
        return

    superuser = get_superuser(session)
    if not superuser:
        logger.warning("Superuser not found, cannot create test news")
        return

    news_without_images_count = 0

    for i, news_data in enumerate(NEWS_DATA, start=1):
        if news_without_images_count < MIN_NEWS_WITHOUT_IMAGES:
            news_without_images_count += 1

        create_news_item(
            session=session,
            superuser=superuser,
            news_data=news_data,
            index=i,
            news_without_images_count=news_without_images_count,
            min_news_without_images=MIN_NEWS_WITHOUT_IMAGES,
        )
