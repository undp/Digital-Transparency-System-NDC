import { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Progress, Tag, Steps, message, Skeleton, Button } from 'antd';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './programmeView.scss';
import { isBase64 } from '../../Components/ProfileIcon/profile.icon';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import InfoView from '../../Components/InfoView/info.view';
import * as Icon from 'react-bootstrap-icons';
import {
  BlockOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { DevBGColor, DevColor } from '../Common/role.color.constants';
import Geocoding from '@mapbox/mapbox-sdk/services/geocoding';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import OrganisationStatus from '../../Components/Organisation/organisationStatus';
import {
  Loading,
  MapComponent,
  MapTypes,
  MarkerData,
  Programme,
  ProgrammeStage,
  TypeOfMitigation,
  UnitField,
  addCommSep,
  addSpaces,
  getStageEnumVal,
  getStageTagType,
  sumArray,
} from '@undp/carbon-library';
import { useSettingsContext } from '../../Context/SettingsContext/settingsContext';
import RoleIcon from '../../Components/RoleIcon/role.icon';
import { CompanyState } from '../../Casl/enums/company.state.enum';
import ProgrammeDocuments from '../../Components/Programme/programmeDocuments';
import InvestmentBody from '../../Components/InvestmentBody/investmentBody';
import {
  ProgrammeT,
  getFinancialFields,
  getGeneralFields,
} from '../../Definitions/InterfacesAndType/programme.definitions';
import NdcActionBody from '../../Components/NdcActionBody/ndcActionBody';

const ProgrammeView = () => {
  const { get, put, post } = useConnection();

  const { userInfoState } = useUserContext();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<ProgrammeT>();
  const [historyData, setHistoryData] = useState<any>([]);
  const [ndcActionHistoryData, setNdcActionHistoryData] = useState<any>([]);
  const [ndcActionHistoryDataGrouped, setNdcActionHistoryDataGrouped] = useState<any>();
  const [ndcActionData, setNdcActionData] = useState<any>([]);
  const { i18n, t } = useTranslation(['view']);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [loadingAll, setLoadingAll] = useState<boolean>(true);
  const [openModal, setOpenModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [comment, setComment] = useState<any>(undefined);
  const [certs, setCerts] = useState<any>([]);
  const [certTimes, setCertTimes] = useState<any>({});
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [centerPoint, setCenterPoint] = useState<number[]>([]);
  const mapType = process.env.REACT_APP_MAP_TYPE ? process.env.REACT_APP_MAP_TYPE : MapTypes.Mapbox;
  const [isAllOwnersDeactivated, setIsAllOwnersDeactivated] = useState(true);
  const [emissionsReductionExpected, setEmissionsReductionExpected] = useState(0);
  const [emissionsReductionAchieved, setEmissionsReductionAchieved] = useState(0);
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [accessTokenMap, setAccessTokenMap] = useState<any>('');

  const showModal = () => {
    setOpenModal(true);
  };

  const locationColors = ['#6ACDFF', '#FF923D', '#CDCDCD', '#FF8183', '#B7A4FE'];

  const getCenter = (list: any[]) => {
    let count = 0;
    let lat = 0;
    let long = 0;
    for (const l of list) {
      if (l === null || l === 'null') {
        continue;
      }
      count += 1;
      lat += l[0];
      long += l[1];
    }
    return [lat / count, long / count];
  };

  const drawMap = () => {
    setTimeout(async () => {
      if (data?.geographicalLocationCordintes && data?.geographicalLocationCordintes.length > 0) {
        setCenterPoint(getCenter(data?.geographicalLocationCordintes));
        const markerList = [];
        for (const iloc in data?.geographicalLocationCordintes) {
          if (data?.geographicalLocationCordintes[iloc] !== null) {
            const markerData: MarkerData = {
              color: locationColors[(Number(iloc) + 1) % locationColors.length],
              location: data?.geographicalLocationCordintes[iloc],
            };

            markerList.push(markerData);
          }
        }

        setMarkers(markerList);
      } else {
        let accessToken;
        if (mapType === MapTypes.Mapbox && process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN) {
          accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN;
          setAccessTokenMap(accessToken);
        }

        if (!accessToken || !data!.programmeProperties.geographicalLocation) return;

        for (const address of data!.programmeProperties.geographicalLocation) {
          const response = await Geocoding({ accessToken: accessToken })
            .forwardGeocode({
              query: address,
              autocomplete: false,
              limit: 1,
              types: ['region', 'district'],
              countries: [process.env.COUNTRY_CODE || 'NG'],
            })
            .send();

          if (
            !response ||
            !response.body ||
            !response.body.features ||
            !response.body.features.length
          ) {
            console.error('Invalid response:');
            console.error(response);
            return;
          }
          const feature = response.body.features[0];
          setCenterPoint(feature.center);
          const marker: MarkerData = {
            location: feature.center,
          };
          setMarkers([marker]);
        }
      }
    }, 1000);
  };

  const getProgrammeById = async (programmeId: string) => {
    try {
      const response: any = await post('national/programme/query', {
        page: 1,
        size: 2,
        filterAnd: [
          {
            key: 'programmeId',
            operation: '=',
            value: programmeId,
          },
        ],
      });
      if (response.data && response.data.length > 0) {
        const d = response.data[0];
        setData(d);
        navigate('.', { state: { record: d } });
      }
    } catch (error: any) {
      console.log('Error in getting programme', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    }
    setLoadingAll(false);
  };

  const addElement = (e: any, time: number, hist: any) => {
    time = Number(time);
    if (!hist[time]) {
      hist[time] = [];
    }
    hist[time].push(e);
  };

  const formatString = (langTag: string, vargs: any[]) => {
    const str = t(langTag);
    const parts = str.split('{}');
    let insertAt = 1;
    for (const arg of vargs) {
      parts.splice(insertAt, 0, arg);
      insertAt += 2;
    }
    return parts.join('');
  };

  const getDocuments = async (programmeId: string) => {
    setLoadingHistory(true);
    try {
      const response: any = await post('national/programme/queryDocs', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'programmeId',
            operation: '=',
            value: programmeId,
          },
        ],
      });
      if (response?.data?.length > 0) {
        const objectsWithoutNullActionId = response?.data.filter(
          (obj: any) => obj.actionId !== null
        );
        setNdcActionData(objectsWithoutNullActionId);
        setDocumentsData(response?.data);
      }
    } catch (err: any) {
      console.log('Error in getting documents - ', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getInvestmentHistory = async (programmeId: string) => {
    setLoadingHistory(true);
    try {
      const response: any = await post('national/programme/investmentQuery', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'programmeId',
            operation: '=',
            value: programmeId,
          },
        ],
      });
      const investmentHisData = response?.data?.map((item: any) => {
        const investmentData: any = {
          invester: item?.receiver[0]?.name,
          amount: item?.amount,
          createdAt: item?.createdTime,
          type: item?.type,
          level: item?.level,
          stream: item?.stream,
          status: item?.status,
          requestId: item?.requestId,
        };
        return investmentData;
      });
      const elArr = investmentHisData?.map((investmentData: any, index: any) => {
        const element = {
          status: 'process',
          title: t('view:investment') + ' ' + String(index + 1), // Extracting the last 3 characters from actionNo
          subTitle: '',
          description: <InvestmentBody data={investmentData} />,
          icon: (
            <span className="step-icon freeze-step">
              <Icon.Circle />
            </span>
          ),
        };
        return element;
      });
      setHistoryData(elArr);
    } catch (error: any) {
      console.log('Error in getting programme', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoadingHistory(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getNdcActionHistory = async (programmeId?: string) => {
    setLoadingHistory(true);
    try {
      // if (programmeId && ndcActionDataItem === null) {
      const response: any = await post('national/programme/queryNdcActions', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'programmeId',
            operation: '=',
            value: programmeId,
          },
        ],
      });
      console.log('ndc actions --------- > ');
      console.log(response.data);
      const groupedByActionId = response.data.reduce((result: any, obj: any) => {
        const actionId = obj.id;
        if (!result[actionId]) {
          result[actionId] = [];
        }
        result[actionId].push(obj);
        return result;
      }, {});
      setNdcActionHistoryDataGrouped(groupedByActionId);
      const mappedElements = Object.keys(groupedByActionId).map((actionId) => ({
        status: 'process',
        title: actionId,
        subTitle: '',
        description: (
          <NdcActionBody
            data={groupedByActionId[actionId]}
            progressIcon={
              <CheckCircleOutlined className="common-progress-icon" style={{ color: '#5DC380' }} />
            }
            programmeId={data?.programmeId}
          />
        ),
        icon: (
          <span className="step-icon freeze-step">
            <Icon.Circle />
          </span>
        ),
      }));
      setNdcActionHistoryData(mappedElements);
    } catch (error: any) {
      console.log('Error in getting programme', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoadingHistory(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getSuccessMsg = (response: any, initMsg: string, successMsg: string) => {
    return response.data instanceof Array ? initMsg : successMsg;
  };

  const mapArrayToi18n = (map: any) => {
    if (!map) {
      return {};
    }

    const info: any = {};
    Object.entries(map).forEach(([k, v]) => {
      const text = t('view:' + k);
      if (v instanceof UnitField) {
        const unitField = v as UnitField;
        info[text + ` (${unitField.unit})`] = unitField.value;
      } else {
        info[text] = v;
      }
    });
    return info;
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const programmeId = queryParams.get('id');
    if (programmeId) {
      getProgrammeById(programmeId);
    } else if (!state) {
      navigate('/programmeManagement/viewAll', { replace: true });
    } else {
      if (!state.record) {
        if (state.id) {
          getProgrammeById(state.id);
        }
      } else {
        setLoadingAll(false);
        setData(state.record);
      }
    }
  }, []);

  useEffect(() => {
    console.log('---- programme data -------- ');
    console.log(data);
    if (data) {
      getInvestmentHistory(data?.programmeId);
      getNdcActionHistory(data?.programmeId);
      getDocuments(data?.programmeId);
      setEmissionsReductionExpected(
        data?.emissionReductionExpected !== null || data?.emissionReductionExpected !== undefined
          ? Number(data?.emissionReductionExpected)
          : 0
      );
      setEmissionsReductionAchieved(
        data?.emissionReductionAchieved !== null || data?.emissionReductionAchieved !== undefined
          ? Number(data?.emissionReductionAchieved)
          : 0
      );
      drawMap();
      for (const company of data.company) {
        if (
          String(company.state) === CompanyState.ACTIVE.valueOf() &&
          company.companyId !== userInfoState?.companyId
        ) {
          setIsAllOwnersDeactivated(false);
          break;
        }
      }
    }
  }, [data]);

  if (!data) {
    return <Loading />;
  }

  const percentages: any[] = [];

  const companies: any = {};
  for (const c of data.company) {
    companies[c.companyId] = c;
  }
  data.companyId.forEach((obj: any, index: number) => {
    percentages.push({
      company: companies[obj],
      percentage: data.proponentPercentage ? data.proponentPercentage[index] : 100,
    });
  });
  percentages.sort((a: any, b: any) => b.percentage - a.percentage);

  const elements = percentages.map((ele: any, index: number) => {
    return (
      <div className="">
        <div className="company-info">
          {isBase64(ele.company.logo) ? (
            <img alt="company logo" src={'data:image/jpeg;base64,' + ele.company.logo} />
          ) : ele.company.logo ? (
            <img alt="company logo" src={ele.company.logo} />
          ) : ele.company.name ? (
            <div className="programme-logo">{ele.company.name.charAt(0).toUpperCase()}</div>
          ) : (
            <div className="programme-logo">{'A'}</div>
          )}
          <div className="text-center programme-name">{ele.company.name}</div>
          <div className="progress-bar">
            <div>
              <div className="float-left">{t('view:ownership')}</div>
              <div className="float-right">{ele.percentage}%</div>
            </div>
            <Progress percent={ele.percentage} strokeWidth={7} status="active" showInfo={false} />
          </div>
          <OrganisationStatus organisationStatus={parseInt(ele.company.state)}></OrganisationStatus>
        </div>
      </div>
    );
  });
  // genCerts(data);
  const actionBtns = [
    <Button type="primary" onClick={() => {}}>
      {t('view:addInvestment')}
    </Button>,
    <Button type="primary" onClick={() => {}}>
      {t('view:addAction')}
    </Button>,
  ];

  const generalInfo: any = {};
  Object.entries(getGeneralFields(data)).forEach(([k, v]) => {
    const text = t('view:' + k);
    if (k === 'currentStatus') {
      generalInfo[text] = (
        <Tag color={getStageTagType(v as ProgrammeStage)}>{getStageEnumVal(v as string)}</Tag>
      );
    } else if (k === 'sector') {
      generalInfo[text] = (
        <Tag color={v === 'Agriculture' ? 'success' : 'processing'}>{v as string}</Tag>
      );
    } else if (k === 'applicationType') {
      generalInfo[text] = (
        <span>
          <RoleIcon icon={<ExperimentOutlined />} bg={DevBGColor} color={DevColor} />
          <span>{v as string}</span>
        </span>
      );
    } else {
      generalInfo[text] = v;
    }
  });

  let calculations: any = {};
  if (data.typeOfMitigation === TypeOfMitigation.AGRICULTURE) {
    if (data.agricultureProperties) {
      calculations = data.agricultureProperties;
      if (calculations.landAreaUnit) {
        calculations.landArea = new UnitField(
          data.agricultureProperties.landAreaUnit,
          addCommSep(data.agricultureProperties.landArea)
        );
      }
      delete calculations.landAreaUnit;
    }
  } else if (data.typeOfMitigation === TypeOfMitigation.SOLAR) {
    if (data.solarProperties) {
      calculations = data.solarProperties;
      if (calculations.energyGenerationUnit) {
        calculations.energyGeneration = new UnitField(
          data.solarProperties.energyGenerationUnit,
          addCommSep(data.solarProperties.energyGeneration)
        );
      } else if (calculations.consumerGroup && typeof calculations.consumerGroup === 'string') {
        calculations.consumerGroup = (
          <Tag color={'processing'}>{addSpaces(calculations.consumerGroup)}</Tag>
        );
      }
      delete calculations.energyGenerationUnit;
    }
  }
  if (calculations) {
    calculations.constantVersion = data.constantVersion;
  }

  const getFileName = (filepath: string) => {
    const index = filepath.indexOf('?');
    if (index > 0) {
      filepath = filepath.substring(0, index);
    }
    const lastCharcter = filepath.charAt(filepath.length - 1);
    if (lastCharcter === '/') {
      filepath = filepath.slice(0, -1);
    }
    return filepath.substring(filepath.lastIndexOf('/') + 1);
  };

  const fileItemContent = (filePath: any) => {
    return (
      <Row className="field" key={filePath}>
        <Col span={12} className="field-key">
          <a target="_blank" href={filePath} rel="noopener noreferrer" className="file-name">
            {getFileName(filePath)}
          </a>
        </Col>
        <Col span={12} className="field-value">
          <a target="_blank" href={filePath} rel="noopener noreferrer" className="file-name">
            <Icon.Link45deg style={{ verticalAlign: 'middle' }} />
          </a>
        </Col>
      </Row>
    );
  };

  const getFileContent = (files: any) => {
    if (Array.isArray(files)) {
      return files.map((filePath: any) => {
        return fileItemContent(filePath);
      });
    } else {
      return fileItemContent(files);
    }
  };

  return loadingAll ? (
    <Loading />
  ) : (
    <div className="content-container programme-view">
      <div className="title-bar">
        <div>
          <div className="body-title">{t('view:details')}</div>
          <div className="body-sub-title">{t('view:desc')}</div>
        </div>
        <div className="flex-display action-btns margin-left-1">{actionBtns}</div>
      </div>
      <div className="content-body">
        <Row gutter={16}>
          <Col md={24} lg={10}>
            <Card className="card-container">
              <div className="info-view">
                <div className="title">
                  <span className="title-icon">
                    {
                      <span className="b-icon">
                        <Icon.Building />
                      </span>
                    }
                  </span>
                  <span className="title-text">{t('view:programmeOwner')}</span>
                </div>
                <div className="centered-card">{elements}</div>
              </div>
            </Card>
            {data?.emissionReductionAchieved ||
              (data?.emissionReductionExpected && (
                <Card className="card-container">
                  <div className="info-view">
                    <div className="title">
                      <span className="title-icon">{<BlockOutlined />}</span>
                      <span className="title-text">
                        {formatString('view:emissionsReductions', [])}
                      </span>
                    </div>
                    <div className="map-content">
                      <Chart
                        id={'creditChart'}
                        options={{
                          labels: ['Achieved', 'Expected'],
                          legend: {
                            position: 'bottom',
                          },
                          colors: ['#b3b3ff', '#e0e0eb'],
                          tooltip: {
                            fillSeriesColor: false,
                          },
                          states: {
                            normal: {
                              filter: {
                                type: 'none',
                                value: 0,
                              },
                            },
                            hover: {
                              filter: {
                                type: 'none',
                                value: 0,
                              },
                            },
                            active: {
                              allowMultipleDataPointsSelection: true,
                              filter: {
                                type: 'darken',
                                value: 0.7,
                              },
                            },
                          },
                          stroke: {
                            colors: ['#00'],
                          },
                          plotOptions: {
                            pie: {
                              expandOnClick: false,
                              donut: {
                                size: '75%',
                                labels: {
                                  show: true,
                                  total: {
                                    showAlways: true,
                                    show: true,
                                    label: 'Expected',
                                    formatter: () =>
                                      '' + addCommSep(data?.emissionReductionExpected),
                                  },
                                },
                              },
                            },
                          },
                          dataLabels: {
                            enabled: false,
                          },
                          responsive: [
                            {
                              breakpoint: 480,
                              options: {
                                chart: {
                                  width: '15vw',
                                },
                                legend: {
                                  position: 'bottom',
                                },
                              },
                            },
                          ],
                        }}
                        series={[emissionsReductionAchieved, emissionsReductionExpected]}
                        type="donut"
                        width="100%"
                        fontFamily="inter"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            <Card className="card-container">
              <div>
                <ProgrammeDocuments
                  data={documentsData}
                  title={t('view:programmeDocs')}
                  icon={<QrcodeOutlined />}
                  programmeId={data?.programmeId}
                  getDocumentDetails={() => {
                    getDocuments(data?.programmeId);
                  }}
                />
              </div>
            </Card>
            {mapType !== MapTypes.None ? (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<Icon.PinMap />}</span>
                    <span className="title-text">{t('view:location')}</span>
                  </div>
                  <div className="map-content">
                    <MapComponent
                      mapType={mapType}
                      center={centerPoint}
                      zoom={4}
                      markers={markers}
                      height={250}
                      style="mapbox://styles/mapbox/streets-v11"
                      accessToken={accessTokenMap}
                    ></MapComponent>
                    <Row className="region-list">
                      {data.programmeProperties.geographicalLocation &&
                        data.programmeProperties.geographicalLocation.map((e: any, idx: number) => (
                          <Col className="loc-tag">
                            {data.geographicalLocationCordintes &&
                              data.geographicalLocationCordintes[idx] !== null &&
                              data.geographicalLocationCordintes[idx] !== undefined && (
                                <span
                                  style={{
                                    color: locationColors[(idx + 1) % locationColors.length],
                                  }}
                                  className="loc-icon"
                                >
                                  {<Icon.GeoAltFill />}
                                </span>
                              )}
                            <span className="loc-text">{e}</span>
                          </Col>
                        ))}
                    </Row>
                  </div>
                </div>
              </Card>
            ) : (
              ''
            )}
          </Col>
          <Col md={24} lg={14}>
            <Card className="card-container">
              <div>
                <InfoView data={generalInfo} title={t('view:general')} icon={<BulbOutlined />} />
              </div>
            </Card>
            <Card className="card-container">
              <div>
                <InfoView
                  data={mapArrayToi18n(getFinancialFields(data))}
                  title={t('view:financial')}
                  icon={
                    <span className="b-icon">
                      <Icon.Cash />
                    </span>
                  }
                />
              </div>
            </Card>
            {historyData?.length > 0 && (
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">{<ClockCircleOutlined />}</span>
                    <span className="title-text">{t('view:investment')}</span>
                  </div>
                  <div className="content">
                    {loadingHistory ? (
                      <Skeleton />
                    ) : (
                      <Steps current={0} direction="vertical" items={historyData} />
                    )}
                  </div>
                </div>
              </Card>
            )}
            <Card className="card-container">
              <div className="info-view">
                <div className="title">
                  <span className="title-icon">{<ExperimentOutlined />}</span>
                  <span className="title-text">{t('view:ndcActions')}</span>
                </div>
                <div className="content">
                  {loadingHistory ? (
                    <Skeleton />
                  ) : (
                    <Steps current={0} direction="vertical" items={ndcActionHistoryData} />
                  )}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProgrammeView;
