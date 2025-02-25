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
import { FaCalendarPlus, FaCalendarAlt, FaSpinner } from 'react-icons/fa';

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
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary text-3xl mr-2" />
        <span className="text-lg text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
        <p className="font-medium">{error}</p>
        {debugInfo && (
          <details className="mt-2">
            <summary className="text-sm cursor-pointer hover:text-red-800">Debug Information</summary>
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Family Calendar</h2>
        <div className="flex space-x-2">
          <button 
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors flex items-center"
            onClick={() => {
              setSelectedDate(new Date());
              setModalMode('create');
              setSelectedEvent(null);
              setShowEventModal(true);
            }}
          >
            <FaCalendarPlus className="mr-2" /> Add Event
          </button>
          <button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors flex items-center"
            onClick={handleOpenCustodyModal}
          >
            <FaCalendarAlt className="mr-2" /> Manage Custody Schedule
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <ChildrenList children={children} />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Event Types</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-blue-500 mr-2"></span>
                <span className="text-sm">Custody Transfer</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-red-500 mr-2"></span>
                <span className="text-sm">Appointment</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-green-500 mr-2"></span>
                <span className="text-sm">Activity</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></span>
                <span className="text-sm">School</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-gray-500 mr-2"></span>
                <span className="text-sm">Other</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:w-3/4 bg-white rounded-lg shadow-md p-4">
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