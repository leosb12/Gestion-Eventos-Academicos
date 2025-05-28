import React, {useCallback, useState} from 'react';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import {getCroppedImg} from './cropUtils';

const ImageCropper = ({image, onClose, onCrop}) => {
    const [crop, setCrop] = useState({x: 0, y: 0});
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleCrop = async () => {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        onCrop(croppedImage);
        onClose();
    };

    return (
  <div className="modal-overlay" style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 9999
  }}>
    <div style={{
      backgroundColor: 'white', padding: 20, borderRadius: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      maxWidth: '90vw'
    }}>
      <div style={{ width: '100%', height: '300px', position: 'relative' }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={3 / 2}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <Slider
        min={1}
        max={3}
        step={0.1}
        value={zoom}
        onChange={(e, z) => setZoom(z)}
        style={{width: '80%', marginTop: '1rem'}}
      />

      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-success" onClick={handleCrop}>Recortar</button>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  </div>
);

};

export default ImageCropper;
