import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import calendarService from '../services/calendarService';
import childrenService from '../services/childrenService';
import EventModal from './calendar/EventModal';
import CustodyScheduleModal from './calendar/CustodyScheduleModal';
import ChildrenList from './calendar/ChildrenList';
import { format } from 'date-fns';

function Calendar() {
  const { user } = useAuth();
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [custodySchedules, setCustodySchedules] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Fetch events, custody schedules, and children when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get current date range
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Format dates for API
        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');
        
        // Fetch events for the current month
        const fetchedEvents = await calendarService.getEvents(startStr, endStr);
        setEvents(fetchedEvents);
        
        // Fetch custody schedules
        const fetchedSchedules = await calendarService.getCustodySchedules();
        setCustodySchedules(fetchedSchedules);
        
        // Fetch children
        const fetchedChildren = await childrenService.getChildren();
        setChildren(fetchedChildren);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        setError('Failed to load calendar data. Please try again.');
        setDebugInfo(err.toString());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle date range change
  const handleDatesSet = async ({ startStr, endStr }) => {
    try {
      const fetchedEvents = await calendarService.getEvents(startStr, endStr);
      setEvents(fetchedEvents);
    } catch (err) {
      console.error('Error fetching events for date range:', err);
      setError('Failed to load events for the selected date range.');
    }
  };

  // Handle date click
  const handleDateClick = (info) => {
    setSelectedDate(info.date);
    setModalMode('create');
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Handle event click
  const handleEventClick = async (info) => {
    try {
      const eventId = info.event.id;
      const event = await calendarService.getEventById(eventId);
      
      setSelectedEvent(event);
      setModalMode('edit');
      setShowEventModal(true);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Failed to load event details. Please try again.');
    }
  };

  // Handle creating a new event
  const handleCreateEvent = async (eventData) => {
    try {
      const newEvent = await calendarService.createEvent(eventData);
      setEvents(prevEvents => [...prevEvents, newEvent]);
      setShowEventModal(false);
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event. Please try again.');
    }
  };

  // Handle updating an event
  const handleUpdateEvent = async (eventData) => {
    try {
      const updatedEvent = await calendarService.updateEvent(eventData.id, eventData);
      
      // Update the event in the calendar
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
      
      setShowEventModal(false);
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event. Please try again.');
    }
  };

  // Handle deleting an event
  const handleDeleteEvent = async (eventId) => {
    try {
      await calendarService.deleteEvent(eventId);
      
      // Remove the event from the calendar
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      setShowEventModal(false);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
    }
  };

  // Open custody schedule modal
  const handleOpenCustodyModal = () => {
    setShowCustodyModal(true);
  };

  // Handle creating a custody schedule
  const handleCreateCustodySchedule = async (scheduleData) => {
    try {
      const newSchedule = await calendarService.createCustodySchedule(scheduleData);
      setCustodySchedules(prevSchedules => [...prevSchedules, newSchedule]);
      setShowCustodyModal(false);
      
      // Refresh events to show the new custody schedule
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        handleDatesSet({
          startStr: format(calendarApi.view.activeStart, 'yyyy-MM-dd'),
          endStr: format(calendarApi.view.activeEnd, 'yyyy-MM-dd')
        });
      }
    } catch (err) {
      console.error('Error creating custody schedule:', err);
      setError('Failed to create custody schedule. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading calendar...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        {debugInfo && (
          <details>
            <summary>Debug Information</summary>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h3>Family Calendar</h3>
        <div className="calendar-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setSelectedDate(new Date());
              setModalMode('create');
              setSelectedEvent(null);
              setShowEventModal(true);
            }}
          >
            Add Event
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleOpenCustodyModal}
          >
            Manage Custody Schedule
          </button>
        </div>
      </div>
      
      <div className="calendar-layout">
        <div className="calendar-sidebar">
          <ChildrenList children={children} />
          
          <div className="calendar-legend">
            <h4>Event Types</h4>
            <div className="legend-item">
              <span className="color-box" style={{ backgroundColor: '#4285F4' }}></span>
              <span>Custody Transfer</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ backgroundColor: '#EA4335' }}></span>
              <span>Appointment</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ backgroundColor: '#34A853' }}></span>
              <span>Activity</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ backgroundColor: '#FBBC05' }}></span>
              <span>School</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ backgroundColor: '#9E9E9E' }}></span>
              <span>Other</span>
            </div>
          </div>
        </div>
        
        <div className="calendar-main">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            selectable={true}
            editable={true}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
          />
        </div>
      </div>
      
      {showEventModal && (
        <EventModal
          mode={modalMode}
          event={selectedEvent}
          selectedDate={selectedDate}
          children={children}
          onClose={() => setShowEventModal(false)}
          onCreate={handleCreateEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          currentUserId={user?.id}
        />
      )}
      
      {showCustodyModal && (
        <CustodyScheduleModal
          children={children}
          onClose={() => setShowCustodyModal(false)}
          onCreate={handleCreateCustodySchedule}
        />
      )}
    </div>
  );
}

export default Calendar; 