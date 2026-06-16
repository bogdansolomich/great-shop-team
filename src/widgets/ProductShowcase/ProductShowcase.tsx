'use client';
import { useTranslation } from '@/i18n/useTranslation';
import styles from '../ProductShowcase/ProductShowcase.module.scss';
import Image from 'next/image';
import StarRating from '@/widgets/StarRating/StarRating';
import Link from 'next/link';
import { useState } from 'react';

interface ProductShowcase {
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
      front: {
        src: string;
        alt: string;
      };
      back: {
        src: string;
        alt: string;
      };
    };
    gallery: {
      src: string;
      alt: string;
    }[];
    colors: {
      src: string;
      alt: string;
    }[];
  };

  link: {
    href: string;
    label: string;
  };
}

export default function ProductShowcase({
  brand,
  title,
  description,
  price,
  code,
  rating,
  images,
  size,
  link,
}: ProductShowcase) {
  const { t } = useTranslation();
  const [currentSize, setCurrentSize] = useState<number>();
  const [currentColor, setCurrentColor] = useState<number>();

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
        <ul style={{ marginTop: 10 }}>
          {t.product.productCode}
          {code}
        </ul>
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
        {t.product.color}
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
          <button className={styles.actionsButtonsBodyBuy}>{t.product.buyNow}</button>
          <button className={styles.actionsButtonsBodyAdd}>{t.product.addToCart}</button>
        </div>
        <div className={styles.cuurentsLink}>
          <Link href={'/'}>{t.product.materials}</Link>
          <Link href={'/'}>{t.product.measurements}</Link>
          <Link href={'/'}>{t.product.packaging}</Link>
          <Link href={'/'}>{t.product.shippingReturns}</Link>
        </div>
      </div>
    </div>
  );
}
