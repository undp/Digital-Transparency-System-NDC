import { Row, Col, Button, Table, TableProps, Input } from 'antd';
import './baselineForm.scss';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getInitTimeline,
  nonLeafSections,
  projectionSectionOrder,
  SectionOpen,
} from '../../Definitions/projectionsDefinitions';
import { getCollapseIcon, parseNumber } from '../../Utils/utilServices';
import { ProjectionSections } from '../../Enums/projection.enum';
import { BaselineTimeline } from '../../Definitions/configurationDefinitions';
import { GrowthRateProperties } from '../../Enums/configuration.enum';

interface Props {
  index: number;
  projectionType: 'withMeasures' | 'withoutMeasures' | 'withAdditionalMeasures';
}

export const BaselineForm: React.FC<Props> = ({ index, projectionType }) => {
  // context Usage
  const { t } = useTranslation(['projection', 'entityAction']);

  // Collapse State

  const [isSectionOpen, setIsSectionOpen] = useState<SectionOpen>({
    [ProjectionSections.ENERGY]: false,
    [ProjectionSections.INDUSTRY]: false,
    [ProjectionSections.AGR_FOR_OTH_LAND]: false,
    [ProjectionSections.WASTE]: false,
    [ProjectionSections.OTHER]: false,
  });

  // General State

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Finalized State

  const [isFinalized, setIsFinalized] = useState<boolean>();

  // Editable Leaf rows (38)

  const [allEditableData, setAllEditableData] = useState<BaselineTimeline[]>([]);

  // All available rows (49)

  const [allVisibleData, setAllVisibleData] = useState<BaselineTimeline[]>([]);

  // Init Loading

  useEffect(() => {
    setIsLoading(true);

    setIsFinalized(false);
    setAllEditableData(getInitTimeline); // Replace this with the corresponding BE call

    setIsLoading(false);
  }, []);

  // Memo to Cache the visible data

  const controlledVisibleData = useMemo(() => {
    return allVisibleData.filter(
      (item) =>
        item.topicId.length === 1 ||
        isSectionOpen[item.topicId.slice(0, 1) as ProjectionSections] === true
    );
  }, [isSectionOpen, allVisibleData]);

  // Memo to Cache All Visible Data with totals

  const tempVisibleTimeline = useMemo(() => {
    const timeline: BaselineTimeline[] = [];

    for (const section of Object.values(projectionSectionOrder)) {
      section.forEach((topicId) => {
        timeline.push({
          key: `${topicId}_visible_init`,
          topicId: topicId,
          values: nonLeafSections.includes(topicId)
            ? new Array(5).fill(0)
            : allEditableData.find((entry) => entry.topicId === topicId)?.values ??
              new Array(5).fill(0),
        });
      });
    }

    return timeline;
  }, [allEditableData]);

  // Updating All Visible Data when the temp visible data changes

  useEffect(() => {
    setAllVisibleData(tempVisibleTimeline);
  }, [tempVisibleTimeline]);

  // Column Definition

  const baselineTimelineColumns: TableProps<BaselineTimeline>['columns'] = [
    {
      dataIndex: 'topicId',
      align: 'center',
      ellipsis: true,
      fixed: 'left',
      width: 50,
      render: (colValue: string) => {
        if (colValue.length === 1) {
          const currentSection: ProjectionSections = colValue as ProjectionSections;
          return getCollapseIcon(isSectionOpen[currentSection], () => {
            setIsSectionOpen((prevState) => ({
              ...prevState,
              [currentSection]: !prevState[currentSection],
            }));
          });
        } else {
          return null;
        }
      },
    },
    {
      dataIndex: 'topicId',
      align: 'left',
      width: 400,
      fixed: 'left',
      render: (colValue: any) => {
        return (
          <div style={{ marginLeft: `${(colValue.length - 1) * 20}px` }}>
            <span>
              {colValue}
              {'\u00A0'.repeat(3)}
              {t(`${colValue}_title`)}
            </span>
          </div>
        );
      },
    },
  ];

  // Editable Value Update

  const updateValue = (topicId: string, yearIndex: number, newValue: number) => {
    setAllEditableData((prevData) => {
      const entryIndex = prevData.findIndex((entry) => entry.topicId === topicId);

      if (entryIndex === -1) return prevData;

      const updatedData = [...prevData];

      const updatedValues = [...updatedData[entryIndex].values];
      updatedValues[yearIndex] = newValue;

      updatedData[entryIndex] = {
        ...updatedData[entryIndex],
        values: updatedValues,
      };

      return updatedData;
    });
  };

  Object.values(GrowthRateProperties).forEach((value, locIndex) => {
    baselineTimelineColumns.push({
      title: t(`configuration:${value}`),
      dataIndex: 'values',
      width: 150,
      align: 'center',
      render: (sectionValueArray: number[], record: any) => {
        const isNonLeaf: boolean = nonLeafSections.includes(record.topicId);
        return !isNonLeaf ? (
          <Input
            value={sectionValueArray[locIndex] ?? undefined}
            className={isNonLeaf ? undefined : 'leaf-input-box'}
            onChange={(e) => {
              updateValue(record.topicId, locIndex, parseNumber(e.target.value) ?? 0);
            }}
          />
        ) : null;
      },
    });
  });

  const saveBaseline = () => {
    console.log(allEditableData, allVisibleData, projectionType);
  };

  return (
    <div key={index} className="baseline-form">
      <Row className="baseline-timeline">
        <Col span={24}>
          <Table
            loading={isLoading}
            dataSource={controlledVisibleData}
            columns={baselineTimelineColumns}
            pagination={false}
          />
        </Col>
      </Row>
      <Row gutter={20} className="action-row" justify={'end'}>
        <Col>
          <Button
            disabled={isFinalized}
            type="primary"
            size="large"
            block
            onClick={() => saveBaseline()}
          >
            {t('entityAction:save')}
          </Button>
        </Col>
      </Row>
    </div>
  );
};
