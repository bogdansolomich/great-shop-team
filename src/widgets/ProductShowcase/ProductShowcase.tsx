'use client';
import styles from '../ProductShowcase/ProductShowcase.module.scss';
import Image from 'next/image';
import StarRating from '@/widgets/StarRating/StarRating';
import { useEffect, useState } from 'react';

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

const SIDEBAR_ANIMATION_DURATION_MS = 300;

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

  const [isSidebarRendered, setIsSidebarRendered] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleOpenSidebar = (tabId: string) => {
    setActiveTab(tabId);

    if (isSidebarRendered) {
      setIsSidebarVisible(true);
      return;
    }

    setIsSidebarRendered(true);
    window.requestAnimationFrame(() => {
      setIsSidebarVisible(true);
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarVisible(false);
  };

  const handleToggleTab = (tabId: string) => {
    setActiveTab((prev) => (prev === tabId ? null : tabId));
  };

  useEffect(() => {
    document.body.style.overflow = isSidebarRendered ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarRendered]);

  useEffect(() => {
    if (!isSidebarRendered || isSidebarVisible) {
      return;
    }

    const closeTimeout = window.setTimeout(() => {
      setIsSidebarRendered(false);
      setActiveTab(null);
    }, SIDEBAR_ANIMATION_DURATION_MS);

    return () => {
      window.clearTimeout(closeTimeout);
    };
  }, [isSidebarRendered, isSidebarVisible]);

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
            <button
              key={tab.id}
              type='button'
              className={styles.linkItem}
              onClick={() => handleOpenSidebar(tab.id)}
            >
              {tab.label} <span>{'>'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ОВЕРЛЕЙ (БЛЮР) ТА БОКОВА ПАНЕЛЬ */}
      {isSidebarRendered && (
        <>
          {/* Клік по блюру закриває вікно */}
          <div
            className={`${styles.overlay} ${isSidebarVisible ? styles.overlayVisible : styles.overlayHidden}`}
            onClick={handleCloseSidebar}
          />

          <div
            className={`${styles.sidebar} ${isSidebarVisible ? styles.sidebarVisible : styles.sidebarHidden}`}
          >
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
                <div
                  key={tab.id}
                  className={`${styles.accordionItem} ${activeTab === tab.id ? styles.accordionItemOpen : ''}`}
                >
                  <button
                    type='button'
                    className={styles.accordionHeader}
                    onClick={() => handleToggleTab(tab.id)}
                    aria-expanded={activeTab === tab.id}
                  >
                    {tab.label}
                    <span className={styles.accordionIcon} aria-hidden='true'>
                      <span className={styles.accordionChevron} />
                    </span>
                  </button>
                  <div className={styles.accordionContent} aria-hidden={activeTab !== tab.id}>
                    <div className={styles.accordionBody}>
                      <p>
                        Detailed information about {tab.label.toLowerCase()} goes here. Crafted from
                        premium materials designed for comfort and durability.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
