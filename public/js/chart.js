// public/js/review-analytics.js
const ratingsData = <%- JSON.stringify(ratingsData) %>;
const subjects = <%- JSON.stringify(subjects) %>;

subjects.forEach((subject, index) => {
    const ctx = document.getElementById(`chart-${index}`).getContext('2d');
    const data = ratingsData[index];

    const barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map((_, i) => `Review ${i + 1}`),
            datasets: [{
                label: `Ratings for ${subject}`,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ratings'
                    }
                }
            }
        }
    });
});
