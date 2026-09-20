import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  useGetEmployeeDashboardQuery,
  useGetTodayAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
} from '../../features/api/apiSlice';

const EmployeeDashboard = () => {
  const user = useSelector(selectCurrentUser);

  const { data: dashRes, isLoading: dashLoading } = useGetEmployeeDashboardQuery();
  const { data: todayRes, isLoading: todayLoading } = useGetTodayAttendanceQuery();
  const [punchIn] = usePunchInMutation();
  const [punchOut] = usePunchOutMutation();

  const dashboardData = dashRes?.data || {};
  const todayAttendance = todayRes?.data || dashboardData.today || null;
  const isLoading = dashLoading || todayLoading;

  const [showCamera, setShowCamera] = useState(false);
  const [actionType, setActionType] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const monthlySummary = dashboardData.monthlySummary || {};
  const isPunchedIn = todayAttendance?.punchIn?.time;
  const isPunchedOut = todayAttendance?.punchOut?.time;

  // Get location
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
          setLocation({ latitude: lat, longitude: lng, address });
        },
        (err) => {
          setError('Location access denied. Please enable location services.');
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
      // Wait briefly then set srcObject
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied. Please allow camera access.');
    }
  };

  const captureAndSubmit = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setLoading(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Wait for video to be ready
      await new Promise(resolve => {
        if (video.readyState >= 2) resolve();
        else video.addEventListener('loadeddata', resolve, { once: true });
      });

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const selfie = canvas.toDataURL('image/jpeg', 0.8);

      if (!location) {
        setError('Location not available');
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
        // Stop video - the today-attendance query auto-refetches via cache invalidation
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
      } else {
        setError(result.message || 'Something went wrong');
      }
    } catch (err) {
      setError(err?.data?.message || err?.error || 'Something went wrong');
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

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container-fluid">
        <div className="page-header mb-4">
          <h1 className="text-primary">
            <i className="bi bi-person-circle me-2"></i>
            Welcome, {user?.name?.split(' ')[0] || 'Employee'}!
          </h1>
          <p className="text-muted mb-0">Here's your attendance overview for this month</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Today's Status Card */}
        <div className="row mb-4">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">
                  <i className="bi bi-calendar3 me-2 text-primary"></i>
                  Today's Attendance
                </h5>
              </div>
              <div className="card-body">
                {todayAttendance ? (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="p-3 border rounded">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`rounded-circle p-2 ${isPunchedIn ? 'bg-success text-white' : 'bg-light text-muted'}`}>
                            <i className="bi bi-box-arrow-in-right fs-5"></i>
                          </div>
                          <div>
                            <h6 className="mb-0 text-muted small">Punch In</h6>
                            <p className="mb-0 fw-bold">
                              {isPunchedIn
                                ? new Date(todayAttendance.punchIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="p-3 border rounded">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`rounded-circle p-2 ${isPunchedOut ? 'bg-success text-white' : 'bg-light text-muted'}`}>
                            <i className="bi bi-box-arrow-left fs-5"></i>
                          </div>
                          <div>
                            <h6 className="mb-0 text-muted small">Punch Out</h6>
                            <p className="mb-0 fw-bold">
                              {isPunchedOut
                                ? new Date(todayAttendance.punchOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isPunchedOut && (
                      <div className="col-12">
                        <div className="p-3 rounded bg-info bg-opacity-10 border border-info text-center">
                          <i className="bi bi-clock fs-4 text-info me-2"></i>
                          <strong>Working Hours: {todayAttendance.workingHours || 0} hrs</strong>
                          <span className={`badge ms-2 ${todayAttendance.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                            {todayAttendance.status === 'completed' ? 'Full Shift' : 'Incomplete'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted text-center mb-0">No attendance record for today</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">
                  <i className="bi bi-tools me-2 text-warning"></i>
                  Quick Actions
                </h5>
              </div>
              <div className="card-body">
                {!isPunchedIn ? (
                  <button
                    className="btn btn-success btn-lg w-100 mb-2"
                    onClick={() => startCamera('punch-in')}
                    disabled={!location}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Punch In
                  </button>
                ) : !isPunchedOut ? (
                  <button
                    className="btn btn-danger btn-lg w-100 mb-2"
                    onClick={() => startCamera('punch-out')}
                  >
                    <i className="bi bi-box-arrow-left me-2"></i>
                    Punch Out
                  </button>
                ) : (
                  <div className="alert alert-success text-center mb-2">
                    <i className="bi bi-check-circle-fill fs-2 d-block"></i>
                    <strong>Attendance Completed!</strong>
                  </div>
                )}

                <Link to="/employee/overtime" className="btn btn-outline-primary w-100">
                  <i className="bi bi-clock-history me-2"></i>
                  Request Overtime
                </Link>

                {!location && (
                  <div className="mt-3 alert alert-warning small">
                    <i className="bi bi-geo-alt me-2"></i>
                    Waiting for location...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="simple-card">
              <div className="simple-card-header">
                <span className="simple-card-title">Days Worked</span>
                <div className="simple-card-icon"><i className="bi bi-calendar-check"></i></div>
              </div>
              <div className="simple-card-value text-primary">{monthlySummary.totalDaysWorked || 0}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="simple-card simple-card-success">
              <div className="simple-card-header">
                <span className="simple-card-title">Completed</span>
                <div className="simple-card-icon"><i className="bi bi-trophy"></i></div>
              </div>
              <div className="simple-card-value">{monthlySummary.completedDays || 0}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="simple-card simple-card-warning">
              <div className="simple-card-header">
                <span className="simple-card-title">Incomplete</span>
                <div className="simple-card-icon"><i className="bi bi-exclamation-triangle"></i></div>
              </div>
              <div className="simple-card-value">{monthlySummary.incompleteDays || 0}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="simple-card">
              <div className="simple-card-header">
                <span className="simple-card-title">Overtime</span>
                <div className="simple-card-icon"><i className="bi bi-clock"></i></div>
              </div>
              <div className="simple-card-value text-info">{monthlySummary.overtimeHours || 0} <small>hrs</small></div>
            </div>
          </div>
        </div>

        {/* Punch In/Out Camera Modal */}
        {showCamera && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={stopCamera}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-camera me-2"></i>
                    {actionType === 'punch-in' ? 'Punch In' : 'Punch Out'} - Take Selfie
                  </h5>
                  <button type="button" className="btn-close" onClick={stopCamera}></button>
                </div>
                <div className="modal-body text-center">
                  <div className="position-relative mx-auto" style={{ maxWidth: '500px' }}>
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
                  <p className="text-muted mt-3">
                    <i className="bi bi-info-circle me-1"></i>
                    Position your face in the frame and click Capture
                  </p>
                  {location && (
                    <span className="badge bg-success">
                      <i className="bi bi-geo-alt me-1"></i>
                      Location Captured
                    </span>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={stopCamera}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={captureAndSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-camera me-2"></i>
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
    </div>
  );
};

export default EmployeeDashboard;
