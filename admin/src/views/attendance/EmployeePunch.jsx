import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  useGetTodayAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
} from '../../features/api/apiSlice';

const EmployeePunch = () => {
  const user = useSelector(selectCurrentUser);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { data: todayRes } = useGetTodayAttendanceQuery();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [punchIn] = usePunchInMutation();
  const [punchOut] = usePunchOutMutation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [location, setLocation] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    if (todayRes?.data) setTodayAttendance(todayRes.data);
  }, [todayRes]);

  const isPunchedIn = todayAttendance?.punchIn?.time;
  const isPunchedOut = todayAttendance?.punchOut?.time;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          let address = '';
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            address = data.display_name || '';
          } catch (e) {
            console.log('Geocoding error:', e);
          }

          setLocation({
            latitude: lat,
            longitude: lng,
            address: address
          });
        },
        (err) => {
          setError('Location not available. Please enable location services.');
        }
      );
    }
  }, []);

  const startCamera = async (type) => {
    try {
      setError('');
      setSuccess('');
      setActionType(type);
      setShowCamera(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Could not access camera. Please allow camera access.');
    }
  };

  const captureAndSubmit = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Refs not ready');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      await new Promise(resolve => {
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.addEventListener('loadeddata', resolve, { once: true });
        }
      });

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx.transform) {
        ctx.transform(-1, 0, 0, 1, canvas.width, 0);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const selfie = canvas.toDataURL('image/jpeg', 0.8);

      if (!location) {
        setError('Location not available. Please enable location services.');
        setLoading(false);
        return;
      }

      const payload = {
        selfie,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || ''
      };

      const result = actionType === 'punch-in'
        ? await punchIn(payload).unwrap()
        : await punchOut(payload).unwrap();

      if (result.success) {
        setSuccess(result.message);
        setShowCamera(false);
        setTodayAttendance(result.data);
      } else {
        setError(result.message || 'Failed to punch');
      }
    } catch (err) {
      setError(err?.data?.message || err?.error || 'Something went wrong. Check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Punch In / Out</h1>
        <p className="page-subtitle">Record your attendance with selfie and location</p>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4" role="alert">
          {success}
        </div>
      )}

      <div className="row">
        <div className="col-md-6 mx-auto">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0 text-center">Today's Attendance</h5>
            </div>
            <div className="card-body text-center">
              <div className="mb-4">
                <div className={`rounded-circle mx-auto mb-3 ${isPunchedIn ? 'bg-success' : 'bg-secondary'}`}
                  style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isPunchedIn ? (
                    <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </div>
                <h5>Punch In: {isPunchedIn ? 'Completed' : 'Pending'}</h5>
                {isPunchedIn && (
                  <p className="text-muted mb-0">
                    {new Date(todayAttendance.punchIn.time).toLocaleTimeString()}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <div className={`rounded-circle mx-auto mb-3 ${isPunchedOut ? 'bg-success' : 'bg-secondary'}`}
                  style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isPunchedOut ? (
                    <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </div>
                <h5>Punch Out: {isPunchedOut ? 'Completed' : 'Pending'}</h5>
                {isPunchedOut && (
                  <p className="text-muted mb-0">
                    {new Date(todayAttendance.punchOut.time).toLocaleTimeString()}
                  </p>
                )}
              </div>

              <hr />

              <div className="d-grid gap-2">
                {!isPunchedIn ? (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => startCamera('punch-in')}
                    disabled={!location}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" className="me-2">
                      <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                    </svg>
                    Punch In
                  </button>
                ) : !isPunchedOut ? (
                  <button
                    className="btn btn-success btn-lg"
                    onClick={() => startCamera('punch-out')}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" className="me-2">
                      <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                    </svg>
                    Punch Out
                  </button>
                ) : (
                  <div className="p-4 bg-success bg-opacity-10 rounded">
                    <svg viewBox="0 0 24 24" fill="#198754" width="48" height="48">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <p className="mb-0 mt-2 h5 text-success">Attendance Completed!</p>
                    <p className="text-muted mb-0">Total Hours: {todayAttendance.workingHours} hrs</p>
                  </div>
                )}
              </div>

              {!location && (
                <p className="text-warning mt-3">
                  <small>Waiting for location...</small>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCamera && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {actionType === 'punch-in' ? 'Punch In' : 'Punch Out'} - Take Selfie
                </h5>
                <button type="button" className="btn-close" onClick={stopCamera}></button>
              </div>
              <div className="modal-body">
                <div className="position-relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-100 rounded"
                    style={{ transform: 'scaleX(-1)', maxHeight: '400px', objectFit: 'cover' }}
                  />
                  <canvas ref={canvasRef} className="d-none"></canvas>
                </div>
                <div className="mt-3 d-flex align-items-center justify-content-between">
                  <span className="text-muted">
                    <small>Make sure your face is visible in the camera</small>
                  </span>
                  {location && (
                    <span className="badge bg-success">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="me-1">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      Location Active
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={stopCamera}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    captureAndSubmit();
                  }}
                  disabled={loading || !location}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" className="me-2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      Capture & Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePunch;