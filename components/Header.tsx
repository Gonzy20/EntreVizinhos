import Link from "next/link";
import { BsLeaf } from "react-icons/bs";
import { RxAvatar } from "react-icons/rx";

export default function Header() {

  return (
    <>
      <header className="header">
        <div className="logo-container">
          <BsLeaf className="logo" />
          <h1>EntreVizinhos</h1>
        </div>
        <Link href="/perfil" className="profile-button">
          <RxAvatar />
        </Link>
      </header>
    </>
  );
}