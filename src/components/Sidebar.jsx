import { NavLink } from 'react-router-dom'
import { PenLine, BookOpen, Calendar, Wallet, Users, Settings, Video, Camera, Home, Upload, X, Presentation, FolderOpen } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen, onClose }) {
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose()
    }
  }

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <button className="sidebar-close-btn" onClick={onClose}>
        <X size={24} />
      </button>
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          end
          onClick={handleLinkClick}
        >
          <Home size={20} />
          <span>홈</span>
        </NavLink>

        <div className="sidebar-divider"></div>

        <div className="sidebar-section-title">출판 및 진행자료 생성</div>
        <NavLink
          to="/write"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <PenLine size={20} />
          <span>글쓰기</span>
        </NavLink>

        <NavLink
          to="/articles"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <BookOpen size={20} />
          <span>글읽기</span>
        </NavLink>

        <NavLink
          to="/file-upload"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Upload size={20} />
          <span>글 파일로 올리기</span>
        </NavLink>

        <NavLink
          to="/file-management"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <FolderOpen size={20} />
          <span>업로드 파일 관리</span>
        </NavLink>

        {/* 발표자료 만들기 - 임시로 숨김 처리 */}
        {/* <NavLink
          to="/presentation"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Presentation size={20} />
          <span>발표자료 만들기</span>
        </NavLink> */}

        <div className="sidebar-divider"></div>

        <div className="sidebar-section-title">분과 관리</div>
        <NavLink
          to="/schedule"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Calendar size={20} />
          <span>일정 및 내용기록</span>
        </NavLink>

        <NavLink
          to="/expense"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Wallet size={20} />
          <span>회비사용</span>
        </NavLink>

        <NavLink
          to="/members"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Users size={20} />
          <span>인원현황</span>
        </NavLink>

        <NavLink
          to="/photos"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Camera size={20} />
          <span>활동 사진</span>
        </NavLink>

        <NavLink
          to="/zoom"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Video size={20} />
          <span>줌 미팅 다시보기</span>
        </NavLink>

        <div className="sidebar-divider"></div>

        <NavLink
          to="/admin"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Settings size={20} />
          <span>관리자</span>
        </NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar
