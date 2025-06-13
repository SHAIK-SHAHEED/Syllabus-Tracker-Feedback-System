document.addEventListener("DOMContentLoaded", function() {
  // Form validation for adding topics
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', function(event) {
      const timeSpent = document.querySelector('input[name="timeSpent"]').value;
      if (timeSpent <= 0) {
        alert('Please enter a valid time spent.');
        event.preventDefault(); // Prevent form submission
      }
    });
  }

  // Chart.js logic (only for the progress page)
  const chartCanvas = document.getElementById('progressChart');
  if (chartCanvas) {
    const subjectNames = chartCanvas.dataset.subjects.split(',');
    const completionData = chartCanvas.dataset.completion.split(',').map(Number);
    
    // Check if there is data available for the chart
    if (subjectNames.length === 0 || completionData.length === 0) {
        console.error('No data available for the chart.');
        return; // Exit early if there's no data
    }

    new Chart(chartCanvas, {
      type: 'pie',
      data: {
        labels: subjectNames,
        datasets: [{
          label: 'Syllabus Completion (%)',
          data: completionData,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
        }]
      }
    });
  }
});
$(document).ready(function() {
  $('.delete-form').on('submit', function(e) {
      e.preventDefault(); // Prevent the default form submission
      const form = $(this);
      const actionUrl = form.attr('action'); // Get the action URL

      $.ajax({
          url: actionUrl,
          type: 'DELETE',
          success: function(response) {
              // Handle success - you might want to remove the list item
              form.closest('li').remove();
              alert(response.message); // Show success message
          },
          error: function(xhr) {
              alert('Error deleting: ' + xhr.responseJSON.message);
          }
      });
  });
});
