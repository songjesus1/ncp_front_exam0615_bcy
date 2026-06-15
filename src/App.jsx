import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const API_BASE_URL = "/api";

function App() {
  const [diaries, setDiaries] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // API 요청 실패 시 화면에 보여줄 메시지입니다.
  const [errorMessage, setErrorMessage] = useState("");

  // API 요청 실패 후 무한스크롤이 계속 실행되지 않도록 막는 값입니다.
  const [loadFailed, setLoadFailed] = useState(false);

  // 카드 클릭 시 모달에 보여줄 다이어리 상세 데이터입니다.
  const [selected, setSelected] = useState(null);

  // 모달 표시 여부입니다.
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    diaryDate: "",
    content: "",
    file: null,
  });

  const [editForm, setEditForm] = useState({
    title: "",
    diaryDate: "",
    content: "",
    file: null,
  });

  const loaderRef = useRef(null);

  async function loadDiaries(nextPage = 0) {
    if (loading || loadFailed || (!hasMore && nextPage !== 0)) return;

    setLoading(true);

    // 새로 조회를 시도할 때 이전 에러 메시지를 지웁니다.
    setErrorMessage("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/diaries?page=${nextPage}&size=10`,
      );

      if (!res.ok) {
        throw new Error("다이어리 목록 조회 실패");
      }

      const data = await res.json();

      if (nextPage === 0) {
        setDiaries(data.items);
      } else {
        setDiaries((prev) => [...prev, ...data.items]);
      }

      setHasMore(data.hasMore);
      setPage(nextPage);

      // 정상 조회되면 실패 상태를 해제합니다.
      setLoadFailed(false);
    } catch (error) {
      console.error(error);

      // 실패 상태로 바꿔서 무한스크롤이 같은 요청을 반복하지 않게 합니다.
      setLoadFailed(true);
      setHasMore(false);

      setErrorMessage(
        "다이어리 목록을 불러오지 못했습니다. 백엔드 서버 또는 Nginx proxy 설정을 확인하세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/diaries/${id}`);

      if (!res.ok) {
        throw new Error("다이어리 상세 조회 실패");
      }

      const data = await res.json();

      setSelected(data);

      setEditForm({
        title: data.title,
        diaryDate: data.diary_date,
        content: data.content,
        file: null,
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("다이어리 상세 정보를 불러오지 못했습니다.");
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelected(null);

    setEditForm({
      title: "",
      diaryDate: "",
      content: "",
      file: null,
    });
  }

  async function createDiary(e) {
    e.preventDefault();

    const body = new FormData();
    body.append("title", form.title);
    body.append("diaryDate", form.diaryDate);
    body.append("content", form.content);

    if (form.file) {
      body.append("file", form.file);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/diaries`, {
        method: "POST",
        body,
      });

      if (!res.ok) {
        throw new Error("다이어리 저장 실패");
      }

      setForm({
        title: "",
        diaryDate: "",
        content: "",
        file: null,
      });

      setLoadFailed(false);
      setHasMore(true);
      await loadDiaries(0);
    } catch (error) {
      console.error(error);
      setErrorMessage("다이어리를 저장하지 못했습니다.");
    }
  }

  async function updateDiary(e) {
    e.preventDefault();

    if (!selected) return;

    const body = new FormData();
    body.append("title", editForm.title);
    body.append("diaryDate", editForm.diaryDate);
    body.append("content", editForm.content);

    if (editForm.file) {
      body.append("file", editForm.file);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/diaries/${selected.id}`, {
        method: "PUT",
        body,
      });

      if (!res.ok) {
        throw new Error("다이어리 수정 실패");
      }

      await loadDetail(selected.id);

      setLoadFailed(false);
      setHasMore(true);
      await loadDiaries(0);
    } catch (error) {
      console.error(error);
      setErrorMessage("다이어리를 수정하지 못했습니다.");
    }
  }

  async function deleteDiary(id) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/diaries/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("다이어리 삭제 실패");
      }

      closeModal();

      setLoadFailed(false);
      setHasMore(true);
      await loadDiaries(0);
    } catch (error) {
      console.error(error);
      setErrorMessage("다이어리를 삭제하지 못했습니다.");
    }
  }

  function retryLoadDiaries() {
    setLoadFailed(false);
    setHasMore(true);
    setPage(0);
    loadDiaries(0);
  }

  useEffect(() => {
    loadDiaries(0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries[0].isIntersecting;

      if (isVisible && hasMore && !loading && !loadFailed) {
        loadDiaries(page + 1);
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loading, loadFailed]);

  return (
    <div className="container py-4">
      <header className="mb-4">
        <h1 className="fw-bold">나만의 다이어리</h1>
        <p className="text-muted mb-0">
          React + Node.js + MySQL + Nginx 직접 배포 예제
        </p>
      </header>

      <div className="row g-4">
        <section className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-header fw-bold">다이어리 작성</div>

            <div className="card-body">
              <form onSubmit={createDiary}>
                <input
                  className="form-control mb-2"
                  placeholder="제목"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />

                <input
                  className="form-control mb-2"
                  type="date"
                  value={form.diaryDate}
                  onChange={(e) =>
                    setForm({ ...form, diaryDate: e.target.value })
                  }
                  required
                />

                <textarea
                  className="form-control mb-2"
                  rows="6"
                  placeholder="내용"
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  required
                />

                <input
                  className="form-control mb-3"
                  type="file"
                  onChange={(e) =>
                    setForm({ ...form, file: e.target.files[0] })
                  }
                />

                <button className="btn btn-primary w-100">저장</button>
              </form>
            </div>
          </div>
        </section>

        <section className="col-lg-7">
          <h2 className="h5 fw-bold mb-3">다이어리 목록</h2>

          {errorMessage && (
            <div className="alert alert-warning" role="alert">
              <div className="mb-2">{errorMessage}</div>

              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={retryLoadDiaries}
              >
                다시 불러오기
              </button>
            </div>
          )}

          <div className="row g-3">
            {diaries.map((diary) => (
              <div className="col-md-6" key={diary.id}>
                <div
                  className="card diary-card h-100"
                  onClick={() => loadDetail(diary.id)}
                >
                  <div className="card-body">
                    <div className="text-muted small mb-2">
                      #{diary.id} · {diary.diary_date}
                    </div>

                    <h3 className="h5 card-title">{diary.title}</h3>

                    <p className="text-muted small mb-0">
                      클릭하면 모달창으로 상세 내용을 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div ref={loaderRef} className="text-center text-muted py-4">
            {loading
              ? "불러오는 중..."
              : loadFailed
                ? "목록 조회가 중단되었습니다."
                : hasMore
                  ? "스크롤하면 더 불러옵니다."
                  : "마지막 글입니다."}
          </div>
        </section>
      </div>

      {isModalOpen && selected && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div
              className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title fw-bold">
                      다이어리 상세 / 수정
                    </h5>
                    <div className="text-muted small">#{selected.id}</div>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="닫기"
                    onClick={closeModal}
                  />
                </div>

                <form onSubmit={updateDiary}>
                  <div className="modal-body">
                    <input
                      className="form-control mb-2"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      required
                    />

                    <input
                      className="form-control mb-2"
                      type="date"
                      value={editForm.diaryDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, diaryDate: e.target.value })
                      }
                      required
                    />

                    <textarea
                      className="form-control mb-2"
                      rows="8"
                      value={editForm.content}
                      onChange={(e) =>
                        setEditForm({ ...editForm, content: e.target.value })
                      }
                      required
                    />

                    <input
                      className="form-control mb-3"
                      type="file"
                      onChange={(e) =>
                        setEditForm({ ...editForm, file: e.target.files[0] })
                      }
                    />

                    {selected.original_file_name && (
                      <a
                        className="btn btn-outline-secondary w-100"
                        href={`${API_BASE_URL}/diaries/${selected.id}/download`}
                      >
                        파일 다운로드: {selected.original_file_name}
                      </a>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-danger me-auto"
                      onClick={() => deleteDiary(selected.id)}
                    >
                      삭제
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                    >
                      닫기
                    </button>

                    <button type="submit" className="btn btn-success">
                      수정
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}

export default App;
