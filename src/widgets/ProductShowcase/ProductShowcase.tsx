'use client';
import styles from '../ProductShowcase/ProductShowcase.module.scss';
import Image from 'next/image';
import StarRating from '@/widgets/StarRating/StarRating';
import { useState } from 'react';

interface ProductShowcaseProps {
  brand: string;
  title: string;
  description: string[];
  price: {
    current: number;
    currency: string;
  };
  code: string;
  rating: number;
  size: string[];

  images: {
    main: {
      front: { src: string; alt: string };
      back: { src: string; alt: string };
    };
    gallery: { src: string; alt: string }[];
    colors: { src: string; alt: string }[];
  };

  link: {
    href: string;
    label: string;
  };
}

// Список пунктів для меню та детальної інформації
const INFO_TABS = [
  { id: 'materials', label: 'Materials and design details' },
  { id: 'measurements', label: 'Measurements' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'shipping', label: 'Shipping and returns' },
];

export default function ProductShowcase({
  brand,
  title,
  description,
  price,
  code,
  rating,
  images,
  size,
}: ProductShowcaseProps) {
  const [currentSize, setCurrentSize] = useState<number>();
  const [currentColor, setCurrentColor] = useState<number>();

  // Стейт для керування боковою панеллю
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleOpenSidebar = (tabId: string) => {
    setActiveTab(tabId);
    // Блокуємо скрол сторінки, коли шторка відкрита
    document.body.style.overflow = 'hidden';
  };

  const handleCloseSidebar = () => {
    setActiveTab(null);
    // Повертаємо скрол сторінки
    document.body.style.overflow = '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.images}>
          <div className={styles.image}>
            <Image
              src={images.main.front.src}
              alt={images.main.front.alt}
              width={310}
              height={531}
            />
          </div>
          <div className={styles.image}>
            <Image src={images.main.back.src} alt={images.main.back.alt} width={310} height={531} />
          </div>
        </div>

        <div className={styles.images}>
          {images.gallery.map((item, key) => (
            <Image key={key} src={item.src} alt={item.alt} width={145} height={208} />
          ))}
        </div>
      </div>

      <div className={styles.info}>
        <h2>{brand}</h2>
        <div className={styles.title}>
          <h1>{title}</h1>
          <div>
            {price.current} {price.currency}
          </div>
        </div>
        <div>
          {description.map((item, key) => (
            <ul className={styles.descriptonText} key={key}>
              {item}
            </ul>
          ))}
        </div>
        <ul style={{ marginTop: 10 }}>Product-code:{code}</ul>
        <div className={styles.stars}>
          <StarRating count={rating} />
        </div>
        <div className={styles.buttonsSize}>
          {size.map((item, key) => (
            <button
              key={key}
              onClick={() => setCurrentSize(key)}
              className={key === currentSize ? styles.currentButtonSizeItem : styles.buttonSizeItem}
            >
              {item}
            </button>
          ))}
        </div>
        Color
        <div className={styles.containerColor}>
          {images.colors.map((item, key) => (
            <Image
              key={key}
              src={item.src}
              alt={item.alt}
              width={152}
              height={168}
              onClick={() => setCurrentColor(key)}
              className={key === currentColor ? styles.currentColor : styles.currentColorItem}
            />
          ))}
        </div>
        <div className={styles.actionsButtons}>
          <button className={styles.actionsButtonsBodyBuy}>Buy now</button>
          <button className={styles.actionsButtonsBodyAdd}>Add to cart</button>
        </div>
        {/* Посилання, які тепер відкривають шторку */}
        <div className={styles.cuurentsLink}>
          {INFO_TABS.map((tab) => (
            <div key={tab.id} className={styles.linkItem} onClick={() => handleOpenSidebar(tab.id)}>
              {tab.label} <span>{'>'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ОВЕРЛЕЙ (БЛЮР) ТА БОКОВА ПАНЕЛЬ */}
      {activeTab && (
        <>
          {/* Клік по блюру закриває вікно */}
          <div className={styles.overlay} onClick={handleCloseSidebar} />

          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3>{title}</h3>
              {/* Клік по хрестику закриває вікно */}
              <button className={styles.closeButton} onClick={handleCloseSidebar}>
                ✕
              </button>
            </div>

            <div className={styles.sidebarContent}>
              {/* Тут рендериться контент залежно від обраного пункту */}
              {INFO_TABS.map((tab) => (
                <div key={tab.id} className={styles.accordionItem}>
                  <div className={styles.accordionHeader}>
                    {tab.label}
                    <span>{activeTab === tab.id ? '✕' : '⌵'}</span>
                  </div>
                  {activeTab === tab.id && (
                    <div className={styles.accordionBody}>
                      {/* Тимчасовий текст, сюди можна передавати реальні дані про товар */}
                      <p>
                        Detailed information about {tab.label.toLowerCase()} goes here. Crafted from
                        premium materials designed for comfort and durability.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
