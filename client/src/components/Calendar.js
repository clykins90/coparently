import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import calendarService from '../services/calendarService';
import childService from '../services/childService';
import EventModal from './calendar/EventModal';
import CustodyScheduleModal from './calendar/CustodyScheduleModal';
import ChildrenList from './calendar/ChildrenList';
import ChildModal from './calendar/ChildModal';
import { format } from 'date-fns';

function Calendar() {
  const { user } = useAuth();
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [custodySchedules, setCustodySchedules] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Fetch events when calendar date range changes
  const handleDatesSet = async (dateInfo) => {
    try {
      console.log("Fetching events for date range:", dateInfo.startStr, "to", dateInfo.endStr);
      console.log("Token available:", !!localStorage.getItem('token'));
      
      const start = dateInfo.startStr;
      const end = dateInfo.endStr;
      const fetchedEvents = await calendarService.getEvents(start, end);
      
      console.log("Events fetched successfully:", fetchedEvents);
      
      // Transform events for FullCalendar
      const formattedEvents = fetchedEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        allDay: event.is_all_day,
        backgroundColor: getEventColor(event),
        borderColor: getEventColor(event),
        extendedProps: {
          description: event.description,
          location: event.location,
          eventType: event.event_type,
          isRecurring: event.is_recurring,
          recurrencePattern: event.recurrence_pattern,
          responsibleParentId: event.responsible_parent_id,
          createdById: event.created_by_id,
          status: event.status,
          notes: event.notes,
          children: event.Children || [],
          creator: event.creator,
          responsibleParent: event.responsibleParent
        }
      }));
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setDebugInfo({
        message: err.message,
        stack: err.stack,
        token: localStorage.getItem('token') ? 'Token exists' : 'No token'
      });
      setError('Failed to load events. Please try again later.');
    }
  };

  // Get color for event based on event type and status
  const getEventColor = (event) => {
    // If event has a custom color, use it
    if (event.color) return event.color;
    
    // Otherwise, use colors based on event type
    switch (event.event_type) {
      case 'custody_transfer':
        return '#4285F4'; // Blue
      case 'appointment':
        return '#EA4335'; // Red
      case 'activity':
        return '#34A853'; // Green
      case 'school':
        return '#FBBC05'; // Yellow
      default:
        return '#9E9E9E'; // Grey
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching initial data...");
        console.log("User:", user);
        console.log("Token available:", !!localStorage.getItem('token'));
        
        // Fetch children
        const fetchedChildren = await childService.getChildren();
        console.log("Children fetched successfully:", fetchedChildren);
        setChildren(fetchedChildren);
        
        // Fetch custody schedules
        const fetchedSchedules = await calendarService.getCustodySchedules();
        console.log("Custody schedules fetched successfully:", fetchedSchedules);
        setCustodySchedules(fetchedSchedules);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setDebugInfo({
          message: err.message,
          stack: err.stack,
          token: localStorage.getItem('token') ? 'Token exists' : 'No token',
          user: user ? 'User exists' : 'No user'
        });
        setError('Failed to load data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [user]);

  // Handle date click to create a new event
  const handleDateClick = (info) => {
    setSelectedDate(info.date);
    setModalMode('create');
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Handle event click to edit an existing event
  const handleEventClick = (info) => {
    const eventData = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      allDay: info.event.allDay,
      ...info.event.extendedProps
    };
    
    setSelectedEvent(eventData);
    setModalMode('edit');
    setShowEventModal(true);
  };

  // Handle creating a new event
  const handleCreateEvent = async (eventData) => {
    try {
      const newEvent = await calendarService.createEvent(eventData);
      
      // Add the new event to the calendar
      const formattedEvent = {
        id: newEvent.id,
        title: newEvent.title,
        start: newEvent.start_time,
        end: newEvent.end_time,
        allDay: newEvent.is_all_day,
        backgroundColor: getEventColor(newEvent),
        borderColor: getEventColor(newEvent),
        extendedProps: {
          description: newEvent.description,
          location: newEvent.location,
          eventType: newEvent.event_type,
          isRecurring: newEvent.is_recurring,
          recurrencePattern: newEvent.recurrence_pattern,
          responsibleParentId: newEvent.responsible_parent_id,
          createdById: newEvent.created_by_id,
          status: newEvent.status,
          notes: newEvent.notes,
          children: newEvent.Children || [],
          creator: newEvent.creator,
          responsibleParent: newEvent.responsibleParent
        }
      };
      
      setEvents(prevEvents => [...prevEvents, formattedEvent]);
      setShowEventModal(false);
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event. Please try again.');
    }
  };

  // Handle updating an existing event
  const handleUpdateEvent = async (eventData) => {
    try {
      const updatedEvent = await calendarService.updateEvent(eventData.id, eventData);
      
      // Update the event in the calendar
      setEvents(prevEvents => prevEvents.map(event => 
        event.id === updatedEvent.id 
          ? {
              id: updatedEvent.id,
              title: updatedEvent.title,
              start: updatedEvent.start_time,
              end: updatedEvent.end_time,
              allDay: updatedEvent.is_all_day,
              backgroundColor: getEventColor(updatedEvent),
              borderColor: getEventColor(updatedEvent),
              extendedProps: {
                description: updatedEvent.description,
                location: updatedEvent.location,
                eventType: updatedEvent.event_type,
                isRecurring: updatedEvent.is_recurring,
                recurrencePattern: updatedEvent.recurrence_pattern,
                responsibleParentId: updatedEvent.responsible_parent_id,
                createdById: updatedEvent.created_by_id,
                status: updatedEvent.status,
                notes: updatedEvent.notes,
                children: updatedEvent.Children || [],
                creator: updatedEvent.creator,
                responsibleParent: updatedEvent.responsibleParent
              }
            }
          : event
      ));
      
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

  // Open child modal for adding a new child
  const handleOpenAddChildModal = () => {
    setSelectedChild(null);
    setShowChildModal(true);
  };

  // Handle child creation/update success
  const handleChildSuccess = async () => {
    try {
      // Refresh the children list
      const fetchedChildren = await childService.getChildren();
      setChildren(fetchedChildren);
    } catch (err) {
      console.error('Error refreshing children:', err);
      setError('Failed to refresh children list.');
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
          <ChildrenList 
            children={children} 
            onAddChild={handleOpenAddChildModal} 
          />
          
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
      
      {showChildModal && (
        <ChildModal
          child={selectedChild}
          onClose={() => setShowChildModal(false)}
          onSuccess={handleChildSuccess}
        />
      )}
    </div>
  );
}

export default Calendar; 