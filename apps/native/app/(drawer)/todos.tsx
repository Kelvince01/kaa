import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Container } from "$/components/container";

export default function TodosScreen() {
  const [newTodoText, setNewTodoText] = useState("");
  const trpc: any = {} as any;

  const todos = useQuery(trpc.todo.getAll.queryOptions());
  const createMutation = useMutation(
    trpc.todo.create.mutationOptions({
      onSuccess: () => {
        todos.refetch();
        setNewTodoText("");
      },
    })
  );
  const toggleMutation = useMutation(
    trpc.todo.toggle.mutationOptions({
      onSuccess: () => {
        todos.refetch();
      },
    })
  );
  const deleteMutation = useMutation(
    trpc.todo.delete.mutationOptions({
      onSuccess: () => {
        todos.refetch();
      },
    })
  );

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      createMutation.mutate({ text: newTodoText });
    }
  };

  const handleToggleTodo = (id: number, completed: boolean) => {
    toggleMutation.mutate({ id, completed: !completed });
  };

  const handleDeleteTodo = (id: number) => {
    Alert.alert("Delete Todo", "Are you sure you want to delete this todo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ id }),
      },
    ]);
  };

  return (
    <Container>
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          <View className="mb-6 rounded-lg border border-border bg-card p-4">
            <Text className="mb-2 font-bold text-2xl text-foreground">
              Todo List
            </Text>
            <Text className="mb-4 text-muted-foreground">
              Manage your tasks efficiently
            </Text>

            <View className="mb-6">
              <View className="mb-2 flex-row items-center space-x-2">
                <TextInput
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  editable={!createMutation.isPending}
                  onChangeText={setNewTodoText}
                  onSubmitEditing={handleAddTodo}
                  placeholder="Add a new task..."
                  placeholderTextColor="#6b7280"
                  returnKeyType="done"
                  value={newTodoText}
                />
                <TouchableOpacity
                  className={`rounded-md px-4 py-2 ${
                    createMutation.isPending || !newTodoText.trim()
                      ? "bg-muted"
                      : "bg-primary"
                  }`}
                  disabled={createMutation.isPending || !newTodoText.trim()}
                  onPress={handleAddTodo}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="font-medium text-white">Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {todos.isLoading ? (
              <View className="flex justify-center py-8">
                <ActivityIndicator color="#3b82f6" size="large" />
              </View>
            ) : todos.data?.length === 0 ? (
              <Text className="py-8 text-center text-muted-foreground">
                No todos yet. Add one above!
              </Text>
            ) : (
              <View className="space-y-2">
                {todos.data?.map((todo) => (
                  <View
                    className="flex-row items-center justify-between rounded-md border border-border bg-background p-3"
                    key={todo.id}
                  >
                    <View className="flex-1 flex-row items-center">
                      <TouchableOpacity
                        className="mr-3"
                        onPress={() =>
                          handleToggleTodo(todo.id, todo.completed)
                        }
                      >
                        <Ionicons
                          color={todo.completed ? "#22c55e" : "#6b7280"}
                          name={todo.completed ? "checkbox" : "square-outline"}
                          size={24}
                        />
                      </TouchableOpacity>
                      <Text
                        className={`flex-1 ${
                          todo.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {todo.text}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="ml-2 p-1"
                      onPress={() => handleDeleteTodo(todo.id)}
                    >
                      <Ionicons
                        color="#ef4444"
                        name="trash-outline"
                        size={20}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
