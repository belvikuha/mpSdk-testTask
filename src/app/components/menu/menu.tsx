"use client";
import {ReactNode, useMemo, useRef, useState} from "react";
import styles from "./src/menu.module.css";

import searchIcon from "./src/icons8-search-24.png";
import menuIcon from "./src/icons8-menu-64.png";
import Image from "next/image";

export interface IMenuOption {
  name: string;
  onClick: () => void;
}
interface IMenuProps {
  children?: ReactNode;
  options?: IMenuOption[];
}
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const Menu = ({children, options}: IMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [filterStr, setFilterStr] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const updateFilterQuery = (str: string) => {
    if (str) {
      setFilterStr(str);
    } else setFilterStr("");
  };

  const delayedFilter = debounce(updateFilterQuery, 500);

  const filteredOptions = useMemo(() => {
    if (filterStr === "") return options;
    return (
      options?.filter(option => {
        if (!option?.name || option.name == "") {
          return false;
        }
        const words: string[] = option.name.split(" ");
        return words.some(word => word.toLowerCase().includes(filterStr.toLowerCase()));
      }) || []
    );
  }, [filterStr, options]);

  const onSearchIconClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isMenuOpen)
    return (
      <div className={styles.menuClosed}>
        <Image
          width="30"
          height="30"
          src={menuIcon}
          alt="menu"
          onClick={() => setIsMenuOpen(true)}
          className={styles.menuBtn}
        />
      </div>
    );

  return (
    <div className={styles.menu}>
      <p>
        <span>Menu</span>{" "}
        <span className={styles.menuBtn} onClick={() => setIsMenuOpen(false)}>
          ⨉
        </span>
      </p>
      <div className={styles.searchStr}>
        <Image alt="saerch" src={searchIcon} onClick={onSearchIconClick} />
        <input
          type="text"
          onChange={e => {
            delayedFilter(e.target.value);
          }}
          placeholder="Search..."
          ref={inputRef}
        />
      </div>
      <ul>
        {filteredOptions?.map((option, i) => (
          <li key={i} onClick={option.onClick}>
            {option.name}
          </li>
        ))}
        {children}
      </ul>
    </div>
  );
};

export default Menu;
