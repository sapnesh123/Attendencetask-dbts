export const DeleteModal = ({ show, onClose, onConfirm }) => {
  if (!show) return null

  return (
    <>
      <div className="modal-backdrop fade show"></div>

      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title text-danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Confirm Delete
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              />
            </div>

            <div className="modal-body">
              <p className="mb-0">
                Are you sure you want to delete this employee?
                <br />
                <strong className="text-danger">
                  This action cannot be undone.
                </strong>
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger"
                onClick={onConfirm}
              >
                Yes, Delete
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
