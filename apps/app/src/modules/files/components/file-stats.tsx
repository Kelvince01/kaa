import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import {
  Archive,
  Clock,
  Code,
  FileIcon,
  FileImage,
  FileText,
  Film,
  HardDrive,
  Music,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FileCategory, FileType } from "../file.type";

type FileStatsProps = {
  files: FileType[];
  storageLimit?: number; // in bytes
  className?: string;
};

type CategoryStats = {
  category: FileCategory | "other";
  count: number;
  size: number;
  percentage: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
};

type TimeSeriesData = {
  date: string;
  uploads: number;
  size: number;
};

export function FileStats({ files, storageLimit, className }: FileStatsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  // Calculate category statistics
  const categoryStats = useMemo((): CategoryStats[] => {
    const categories: {
      [key in FileCategory | "other"]: { count: number; size: number };
    } = {
      image: { count: 0, size: 0 },
      video: { count: 0, size: 0 },
      audio: { count: 0, size: 0 },
      document: { count: 0, size: 0 },
      archive: { count: 0, size: 0 },
      code: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
    };

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    for (const file of files) {
      let category: FileCategory | "other" = "other";

      if (file.mimeType.startsWith("image/")) category = "image";
      else if (file.mimeType.startsWith("video/")) category = "video";
      else if (file.mimeType.startsWith("audio/")) category = "audio";
      else if (
        file.mimeType.includes("pdf") ||
        file.mimeType.includes("document") ||
        file.mimeType.startsWith("text/")
      )
        category = "document";
      else if (
        file.mimeType.includes("zip") ||
        file.mimeType.includes("tar") ||
        file.mimeType.includes("rar")
      )
        category = "archive";
      else if (
        file.mimeType.includes("javascript") ||
        file.mimeType.includes("json") ||
        file.mimeType.includes("xml")
      )
        category = "code";

      categories[category].count++;
      categories[category].size += file.size;
    }

    const colors = {
      image: "#10b981",
      video: "#3b82f6",
      audio: "#8b5cf6",
      document: "#f59e0b",
      archive: "#ef4444",
      code: "#06b6d4",
      other: "#6b7280",
    };

    const icons = {
      image: FileImage,
      video: Film,
      audio: Music,
      document: FileText,
      archive: Archive,
      code: Code,
      other: FileIcon,
    };

    return Object.entries(categories)
      .map(([category, stats]) => ({
        category: category as FileCategory | "other",
        count: stats.count,
        size: stats.size,
        percentage: totalSize > 0 ? (stats.size / totalSize) * 100 : 0,
        color: colors[category as keyof typeof colors],
        icon: icons[category as keyof typeof icons],
      }))
      .filter((stat) => stat.count > 0)
      .sort((a, b) => b.size - a.size);
  }, [files]);

  // Calculate time series data
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const data: TimeSeriesData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "MMM dd");
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayFiles = files.filter((file) => {
        const fileDate = new Date(file.createdAt);
        return fileDate >= dayStart && fileDate <= dayEnd;
      });

      data.push({
        date: dateStr,
        uploads: dayFiles.length,
        size: dayFiles.reduce((sum, file) => sum + file.size, 0),
      });
    }

    return data;
  }, [files, timeRange]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;
  const storageUsedPercentage = storageLimit
    ? (totalSize / storageLimit) * 100
    : 0;

  // Recent uploads (last 7 days)
  const recentUploads = files.filter(
    (file) => new Date(file.createdAt) >= subDays(new Date(), 7)
  );

  // Most common file types
  const mimeTypeStats = useMemo(() => {
    const types: { [key: string]: number } = {};
    for (const file of files) {
      if (file.mimeType) {
        types[file.mimeType] = (types[file.mimeType] || 0) + 1;
      }
    }

    return Object.entries(types)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([mimeType, count]) => ({ mimeType, count }));
  }, [files]);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        dominantBaseline="central"
        fill="white"
        fontSize={12}
        fontWeight="bold"
        textAnchor={x > cx ? "start" : "end"}
        x={x}
        y={y}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Files</CardTitle>
            <FileIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {totalFiles.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              +{recentUploads.length} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{formatBytes(totalSize)}</div>
            {storageLimit && (
              <div className="mt-2">
                <Progress className="h-2" value={storageUsedPercentage} />
                <p className="mt-1 text-muted-foreground text-xs">
                  {storageUsedPercentage.toFixed(1)}% of{" "}
                  {formatBytes(storageLimit)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Average Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatBytes(averageFileSize)}
            </div>
            <p className="text-muted-foreground text-xs">per file</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Recent Activity
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{recentUploads.length}</div>
            <p className="text-muted-foreground text-xs">uploads this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs className="space-y-4" defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="types">File Types</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="categories">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Storage by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer height={300} width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={categoryStats}
                      dataKey="size"
                      fill="#8884d8"
                      label={renderCustomizedLabel}
                      labelLine={false}
                      outerRadius={80}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell
                          fill={entry.color}
                          key={`cell-${index.toString()}`}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatBytes(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category List */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryStats.map((stat) => {
                  const IconComponent = stat.icon;
                  return (
                    <div
                      className="flex items-center space-x-3"
                      key={stat.category}
                    >
                      <div
                        className="flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ backgroundColor: stat.color }}
                      >
                        <IconComponent className="h-2.5 w-2.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-medium text-sm capitalize">
                            {stat.category}
                          </p>
                          <Badge className="ml-2" variant="secondary">
                            {stat.count}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <Progress
                            className="mr-2 h-2 flex-1"
                            style={
                              {
                                "--progress-background": stat.color,
                              } as React.CSSProperties
                            }
                            value={stat.percentage}
                          />
                          <span className="whitespace-nowrap text-muted-foreground text-xs">
                            {formatBytes(stat.size)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="timeline">
          <div className="mb-4 flex items-center space-x-2">
            <label className="font-medium text-sm" htmlFor="timeRange">
              Time Range:
            </label>
            <select
              className="rounded border px-2 py-1 text-sm"
              onChange={(e) =>
                setTimeRange(e.target.value as "7d" | "30d" | "90d")
              }
              value={timeRange}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Upload Count Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Uploads Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer height={300} width="100%">
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      dataKey="uploads"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      stroke="#3b82f6"
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Storage Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Storage Added Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer height={300} width="100%">
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatBytes} />
                    <Tooltip
                      formatter={(value: number) => formatBytes(value)}
                    />
                    <Area
                      dataKey="size"
                      fill="#10b981"
                      fillOpacity={0.3}
                      stroke="#10b981"
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="types">
          <Card>
            <CardHeader>
              <CardTitle>Most Common File Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mimeTypeStats.map((stat, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={stat.mimeType}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-muted font-mono text-xs">
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm">
                        {stat.mimeType}
                      </span>
                    </div>
                    <Badge variant="secondary">{stat.count} files</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
