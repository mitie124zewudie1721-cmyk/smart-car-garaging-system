// src/components/admin/AnalyticsChart.tsx
import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '@/lib/api';
import Loader from '@/components/common/Loader';
import Alert from '@/components/common/Alert';
import { Card } from '@/components/common/Card'; // assuming you have a Card component

// Register Chart.js components (only once)
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface AnalyticsChartProps {
    type?: 'line' | 'bar';
    title: string;
    dataKey: 'users' | 'reservations' | 'revenue';
}

export default function AnalyticsChart({
    type = 'line',
    title,
    dataKey,
}: AnalyticsChartProps) {
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parse dataKey to extract type and period (e.g., "users-month" -> type: "users", period: "month")
                const [analyticsType, period] = dataKey.split('-');

                // Fetch real data from backend
                const response = await api.get(`/admin/analytics/${analyticsType}/${period}`);
                const data = response.data.data || [];

                // Extract labels and values from API response
                const labels = data.map((item: any) => item.label || 'Unknown');
                const values = data.map((item: any) => item.count ?? item.total ?? 0);

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: title,
                            data: values,
                            borderColor: '#6366f1',           // indigo-500
                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            tension: 0.4,
                            fill: type === 'line',           // fill only for line chart
                            pointBackgroundColor: '#6366f1',
                            pointBorderColor: '#fff',
                            pointHoverRadius: 6,
                        },
                    ],
                });
            } catch (err: any) {
                console.error('Analytics fetch error:', err);
                const message = 'Failed to load analytics data';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dataKey, title, type]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader size="lg" />
            </div>
        );
    }

    if (error) {
        return <Alert variant="error">{error}</Alert>;
    }

    if (!chartData || chartData.labels.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No data available for this period
            </div>
        );
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: title,
                font: { size: 18 },
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            x: {
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: string | number) => {
                        if (dataKey === 'revenue') return `$${value}`;
                        return value;
                    },
                },
            },
        },
    };

    return (
        <Card className="p-6 h-96"> {/* fixed height for consistent chart size */}
            {type === 'line' ? (
                <Line options={options} data={chartData} />
            ) : (
                <Bar options={options} data={chartData} />
            )}
        </Card>
    );
}