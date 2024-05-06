import React from "react";
import { useNavigate } from "react-router-dom";
import { Meteor } from "meteor/meteor";
import { useForm } from 'react-hook-form';

export const CreateChoreForm = () => {

  const {
    register,
    handleSubmit,
    formState,
  } = useForm();

  const navigate = useNavigate();

  async function onSubmit(data: {
    group: string;
    title: string;
    description: string;
    intervalDays: string;
  }) {
    try {
      const id = await Meteor.callAsync('chores/create', data.group, data.title, data.description, parseInt(data.intervalDays));
      navigate(`/chores/by-id/${id}`);
    } catch (err) {
      alert(`Creation failed: ${(err as Error).message}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(d => onSubmit(d as any))}>
      <h2>Create Chore</h2>
      <label style={{display: 'block'}}>
        Group:
        <select {...register('group', { required: true })} required>
          <option value="Cleo">🐈‍⬛ Cleo</option>
          <option value="Ginger">🐈 Ginger</option>
          <option value="Household">🏠 Household</option>
          <option value="Trash">🚮 Trash</option>
          <option value="Hygiene">🪥 Hygiene</option>
          <option value="Cleaning">🧹 Cleaning</option>
          <option value="Financial">💸 Financial</option>
        </select>
      </label>
      <label style={{display: 'block'}}>
        Title:
        <input {...register('title', { required: true })} required />
      </label>
      <label style={{display: 'block'}}>
        Description:
        <input {...register('description')} />
      </label>
      <label style={{display: 'block'}}>
        Interval in days:
        <input {...register('intervalDays', { pattern: /\d+/, required: true })} required pattern="\d+" size={4} />
      </label>
      <button type="submit" disabled={formState.isSubmitting}>
        Create
      </button>
    </form>
  );
};
