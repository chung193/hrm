const Waiting = () => {
  return (
    <div
      className="h-screen w-screen absolute top-0 left-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: "#4A484B" }}
    >
      <img src="/waiting.gif" alt="Đang tải..." className="mx-auto mb-4" />
    </div>
  );
};

export default Waiting;
