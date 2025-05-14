// src/components/LogoutModal.jsx
import React from 'react';
import { Modal, Button } from 'your-ui-library'; // el modal que uses

export default function LogoutModal({ open, onConfirm, onCancel }) {
  return (
    <Modal isOpen={open} onRequestClose={onCancel}>
      <h2>¿Seguro que quieres cerrar sesión?</h2>
      <div className="modal-footer">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm}>Sí, cerrar sesión</Button>
      </div>
    </Modal>
  );
}
