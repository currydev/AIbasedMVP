import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Friends() {
  const [friendEmail, setFriendEmail] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchFriendRequests();
      await fetchFriends();
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/friend-requests', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/friends', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/send-friend-request', 
        { friendEmail },
        { headers: { Authorization: localStorage.getItem('token') } }
      );
      alert('Friend request sent');
      setFriendEmail('');
    } catch (error) {
      alert('Error sending friend request');
    }
  };

  const acceptFriendRequest = async (friendId) => {
    try {
      await axios.post('http://localhost:5000/api/accept-friend-request', 
        { friendId },
        { headers: { Authorization: localStorage.getItem('token') } }
      );
      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      alert('Error accepting friend request');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Friends Management</h2>
      
      <form onSubmit={sendFriendRequest} className="mb-8">
        <div className="flex">
          <input
            type="email"
            placeholder="Friend's email"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send Friend Request
          </button>
        </div>
      </form>

      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">Friend Requests</h3>
        {friendRequests.length === 0 ? (
          <p className="text-gray-600">No pending friend requests</p>
        ) : (
          <ul className="space-y-2">
            {friendRequests.map(request => (
              <li key={request._id} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                <span className="text-gray-800">{request.email}</span>
                <button 
                  onClick={() => acceptFriendRequest(request._id)}
                  className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Accept
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">Friends List</h3>
        <p className="text-gray-600 mb-4">You have {friends.length} friend(s)</p>
        {friends.length === 0 ? (
          <p className="text-gray-600">You don't have any friends yet</p>
        ) : (
          <ul className="space-y-2">
            {friends.map(friend => (
              <li key={friend._id} className="bg-gray-100 p-3 rounded-md text-gray-800">
                {friend.email}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Friends;