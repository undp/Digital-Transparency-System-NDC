import { Col, Row } from 'antd';
import './dashboard.scss';
import { InfoCircleOutlined } from '@ant-design/icons';
import ChartInformation from '../../Components/Popups/chartInformation';
import { useState } from 'react';

const Dashboard = () => {
  const [openChartInfo, setOpenChartInfo] = useState<boolean>(false);
  const [chartContent, setChartContent] = useState<{ title: string; body: string }>({
    title: '',
    body: '',
  });
  return (
    <div className="dashboard-page">
      <ChartInformation
        open={openChartInfo}
        setOpen={setOpenChartInfo}
        content={chartContent}
      ></ChartInformation>
      <Row gutter={30}>
        <Col className="gutter-row" span={12}>
          <div className="chart-section-card">
            <div className="chart-title">
              {'Climate Actions'}
              <InfoCircleOutlined
                onClick={() => {
                  setChartContent({ title: 'Climate Actions', body: 'Climate Actions' });
                  setOpenChartInfo(true);
                }}
                style={{ marginLeft: '300px' }}
              />
            </div>
          </div>
        </Col>
        <Col className="gutter-row" span={12}>
          <div className="chart-section-card">
            <div className="chart-title">
              {'Projects'}
              <InfoCircleOutlined
                onClick={() => {
                  setChartContent({ title: 'Projects', body: 'Projects' });
                  setOpenChartInfo(true);
                }}
                style={{ marginLeft: '300px' }}
              />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
